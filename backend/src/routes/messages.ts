import { Router, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AuthRequest } from '../types';
import { sendMessage, getMessages } from '../services/messageService';
import { callAIAPIStream } from '../services/aiService';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/schema';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/conversations/:conversationId/messages
router.get('/:conversationId/messages', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { conversationId } = req.params;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const result = getMessages({ conversationId, userId, page, limit });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取消息失败';
    const statusCode = message === '对话不存在' ? 404 : 500;
    res.status(statusCode).json({ success: false, error: message });
  }
});

// POST /api/conversations/:conversationId/messages
router.post('/:conversationId/messages', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { conversationId } = req.params;
    const body = req.body as any;
    const { content } = body;

    if (!content || typeof content !== 'string') {
      res.status(400).json({ success: false, error: '请提供消息内容' });
      return;
    }

    const result = await sendMessage({ conversationId, userId, content });

    if (result.error) {
      // Return 202 Accepted when AI fails but user message is saved
      res.status(202).json({
        success: true,
        data: {
          userMessage: result.userMessage,
          aiMessage: null,
          error: result.error
        }
      });
    } else {
      res.status(201).json({
        success: true,
        data: {
          userMessage: result.userMessage,
          aiMessage: result.aiMessage!
        }
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '发送消息失败';
    const statusCode = message === '对话不存在' ? 404 : 500;
    res.status(statusCode).json({ success: false, error: message });
  }
});

// POST /api/conversations/:conversationId/messages/stream - SSE streaming endpoint
router.post('/:conversationId/messages/stream', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { conversationId } = req.params;
    const body = req.body as any;
    const { content } = body;

    if (!content || typeof content !== 'string') {
      res.status(400).json({ success: false, error: '请提供消息内容' });
      return;
    }

    // Verify conversation ownership and get model_id
    const conversation = db
      .prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?')
      .get(conversationId, userId) as any;

    if (!conversation) {
      res.status(404).json({ success: false, error: '对话不存在' });
      return;
    }

    const modelId = conversation.model_id || 'gpt-3.5-turbo';
    const now = new Date().toISOString();

    // Save user message first
    const userMessageId = uuidv4();
    db.prepare(
      `INSERT INTO messages (id, conversation_id, sender_id, sender_type, content, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(userMessageId, conversationId, userId, 'user', content, now);

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering

    // Send user message event
    res.write(`event: message\n`);
    res.write(`data: ${JSON.stringify({
      type: 'userMessage',
      data: {
        id: userMessageId,
        sender_type: 'user',
        content,
        created_at: now
      }
    })}\n\n`);

    // Create AI message placeholder
    const aiMessageId = uuidv4();
    const aiNow = new Date().toISOString();

    // Send AI message start event
    res.write(`event: message\n`);
    res.write(`data: ${JSON.stringify({
      type: 'aiMessageStart',
      data: {
        id: aiMessageId,
        sender_type: 'bot',
        created_at: aiNow
      }
    })}\n\n`);

    // Stream AI response chunks
    let fullContent = '';
    try {
      for await (const chunk of callAIAPIStream(content, modelId)) {
        fullContent += chunk;

        // Send chunk event
        res.write(`event: message\n`);
        res.write(`data: ${JSON.stringify({
          type: 'aiMessageChunk',
          data: {
            messageId: aiMessageId,
            content: chunk
          }
        })}\n\n`);
      }

      // Save complete AI message to database
      db.prepare(
        `INSERT INTO messages (id, conversation_id, sender_id, sender_type, content, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(aiMessageId, conversationId, 'bot-ai', 'bot', fullContent, aiNow);

      // Send completion event
      res.write(`event: message\n`);
      res.write(`data: ${JSON.stringify({
        type: 'aiMessageEnd',
        data: {
          messageId: aiMessageId,
          content: fullContent
        }
      })}\n\n`);

      // Send done event
      res.write(`event: done\n`);
      res.write(`data: ${JSON.stringify({ success: true })}\n\n`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'AI调用失败';

      // Send error event
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({
        type: 'error',
        message: errorMessage
      })}\n\n`);

      // Save error message to database
      db.prepare(
        `INSERT INTO messages (id, conversation_id, sender_id, sender_type, content, ai_error, error_message, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        aiMessageId,
        conversationId,
        'bot-ai',
        'bot',
        '[AI 服务暂时不可用]',
        1,
        errorMessage,
        aiNow
      );
    }

    res.end();
  } catch (error) {
    const message = error instanceof Error ? error.message : '发送消息失败';
    const statusCode = message === '对话不存在' ? 404 : 500;

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
