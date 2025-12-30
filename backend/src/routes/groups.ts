import { Router, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AuthRequest } from '../types';
import {
  createGroup,
  getGroups,
  getGroupById,
  deleteGroup,
  sendGroupMessage,
  getGroupMessages
} from '../services/groupService';
import { callBotAI } from '../services/aiService';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/schema';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/group-conversations
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const groups = getGroups(userId);
    res.status(200).json({ success: true, data: groups });
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取群组列表失败';
    res.status(500).json({ success: false, error: message });
  }
});

// POST /api/group-conversations
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const body = req.body as any;
    const { name, botIds } = body;

    if (!name || typeof name !== 'string' || name.length < 1 || name.length > 100) {
      res.status(400).json({ success: false, error: '群组名称长度必须在1-100个字符之间' });
      return;
    }

    if (!Array.isArray(botIds) || botIds.length === 0) {
      res.status(400).json({ success: false, error: '至少需要添加一个机器人' });
      return;
    }

    const group = createGroup({ ownerId: userId, name, botIds });
    res.status(201).json({ success: true, data: group });
  } catch (error) {
    const message = error instanceof Error ? error.message : '创建群组失败';
    const statusCode = message.includes('机器人ID无效') ? 400 : 500;
    res.status(statusCode).json({ success: false, error: message });
  }
});

// GET /api/group-conversations/:groupId
router.get('/:groupId', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { groupId } = req.params;

    const group = getGroupById(groupId, userId);

    if (!group) {
      res.status(404).json({ success: false, error: '群组不存在' });
      return;
    }

    res.status(200).json({ success: true, data: group });
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取群组详情失败';
    res.status(500).json({ success: false, error: message });
  }
});

// DELETE /api/group-conversations/:groupId
router.delete('/:groupId', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { groupId } = req.params;

    const deleted = deleteGroup(groupId, userId);

    if (!deleted) {
      res.status(404).json({ success: false, error: '群组不存在' });
      return;
    }

    res.status(200).json({ success: true, message: '群组已删除' });
  } catch (error) {
    const message = error instanceof Error ? error.message : '删除群组失败';
    res.status(500).json({ success: false, error: message });
  }
});

// GET /api/group-conversations/:groupId/messages
router.get('/:groupId/messages', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { groupId } = req.params;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const result = getGroupMessages({ groupConversationId: groupId, userId, page, limit });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取消息失败';
    const statusCode = message === '群组不存在' ? 404 : 500;
    res.status(statusCode).json({ success: false, error: message });
  }
});

// POST /api/group-conversations/:groupId/messages
router.post('/:groupId/messages', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { groupId } = req.params;
    const body = req.body as any;
    const { content } = body;

    if (!content || typeof content !== 'string') {
      res.status(400).json({ success: false, error: '请提供消息内容' });
      return;
    }

    const result = await sendGroupMessage({
      groupConversationId: groupId,
      userId,
      content
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : '发送消息失败';
    const statusCode = message === '群组不存在' ? 404 : 500;
    res.status(statusCode).json({ success: false, error: message });
  }
});

// POST /api/group-conversations/:groupId/messages/stream - SSE streaming for group messages
router.post('/:groupId/messages/stream', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { groupId } = req.params;
    const body = req.body as any;
    const { content } = body;

    if (!content || typeof content !== 'string') {
      res.status(400).json({ success: false, error: '请提供消息内容' });
      return;
    }

    // Verify group ownership
    const group = db
      .prepare('SELECT * FROM group_conversations WHERE id = ? AND owner_id = ?')
      .get(groupId, userId) as any;

    if (!group) {
      res.status(404).json({ success: false, error: '群组不存在' });
      return;
    }

    const now = new Date().toISOString();

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // Get user name
    const user = db.prepare('SELECT username FROM users WHERE id = ?').get(userId) as any;

    // Save user message
    const userMessageId = uuidv4();
    db.prepare(
      `INSERT INTO messages (id, group_conversation_id, sender_id, sender_type, content, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(userMessageId, groupId, userId, 'user', content, now);

    // Send user message event
    res.write(`event: message\n`);
    res.write(`data: ${JSON.stringify({
      type: 'userMessage',
      data: {
        id: userMessageId,
        sender_type: 'user',
        sender_name: user?.username || 'Unknown',
        content,
        created_at: now
      }
    })}\n\n`);

    // Check last message to prevent bot loops
    const lastMessage = db
      .prepare(
        `SELECT sender_type FROM messages
         WHERE group_conversation_id = ?
         ORDER BY created_at DESC
         LIMIT 1`
      )
      .get(groupId) as { sender_type: string } | undefined;

    // If last message was from bot, don't trigger bot responses
    if (lastMessage && lastMessage.sender_type === 'bot') {
      res.write(`event: done\n`);
      res.write(`data: ${JSON.stringify({ success: true })}\n\n`);
      res.end();
      return;
    }

    // Get all bots in the group
    const bots = db
      .prepare(
        `
        SELECT b.* FROM bots b
        INNER JOIN group_conversation_bots gcb ON b.id = gcb.bot_id
        WHERE gcb.group_conversation_id = ?
        ORDER BY b.id
      `
      )
      .all(groupId) as any[];

    if (bots.length === 0) {
      res.write(`event: done\n`);
      res.write(`data: ${JSON.stringify({ success: true })}\n\n`);
      res.end();
      return;
    }

    // Stream bot responses
    for (const bot of bots) {
      try {
        const botResponse = await callBotAI(bot.id, bot.name, content);

        if (botResponse.success && botResponse.content) {
          const botMessageId = uuidv4();
          const botNow = new Date().toISOString();

          // Send bot message start event
          res.write(`event: message\n`);
          res.write(`data: ${JSON.stringify({
            type: 'aiMessageStart',
            data: {
              id: botMessageId,
              sender_id: bot.id,
              sender_type: 'bot',
              sender_name: bot.name,
              created_at: botNow
            }
          })}\n\n`);

          // Stream the bot response character by character
          const chars = botResponse.content.split('');
          for (const char of chars) {
            // Simulate typing delay
            await new Promise(resolve => setTimeout(resolve, Math.random() * 30 + 10));

            res.write(`event: message\n`);
            res.write(`data: ${JSON.stringify({
              type: 'aiMessageChunk',
              data: {
                messageId: botMessageId,
                sender_name: bot.name,
                content: char
              }
            })}\n\n`);
          }

          // Save bot message to database
          db.prepare(
            `INSERT INTO messages (id, group_conversation_id, sender_id, sender_type, content, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`
          ).run(botMessageId, groupId, bot.id, 'bot', botResponse.content, botNow);

          // Send bot message end event
          res.write(`event: message\n`);
          res.write(`data: ${JSON.stringify({
            type: 'aiMessageEnd',
            data: {
              messageId: botMessageId,
              sender_name: bot.name,
              content: botResponse.content
            }
          })}\n\n`);
        }
      } catch (error) {
        console.error(`Bot ${bot.id} response failed:`, error);
      }
    }

    // Send done event
    res.write(`event: done\n`);
    res.write(`data: ${JSON.stringify({ success: true })}\n\n`);

    res.end();
  } catch (error) {
    const message = error instanceof Error ? error.message : '发送消息失败';
    const statusCode = message === '群组不存在' ? 404 : 500;

    if (!res.headersSent) {
      res.status(statusCode).json({ success: false, error: message });
    } else {
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
      res.end();
    }
  }
});

export default router;
