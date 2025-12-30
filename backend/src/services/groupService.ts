import { v4 as uuidv4 } from 'uuid';
import db from '../db/schema';
import { getGroupBots } from './botService';
import { callBotAI } from './aiService';

interface CreateGroupInput {
  ownerId: string;
  name: string;
  botIds: string[];
}

interface SendGroupMessageInput {
  groupConversationId: string;
  userId: string;
  content: string;
}

interface GetGroupMessagesInput {
  groupConversationId: string;
  userId: string;
  page?: number;
  limit?: number;
}

export function createGroup(input: CreateGroupInput) {
  const { ownerId, name, botIds } = input;
  const groupId = uuidv4();
  const now = new Date().toISOString();

  // Validate bot IDs
  const validBots = db
    .prepare(`SELECT id FROM bots WHERE id IN (${botIds.map(() => '?').join(',')})`)
    .all(...botIds) as { id: string }[];

  if (validBots.length !== botIds.length) {
    throw new Error('部分机器人ID无效');
  }

  // Create group
  db.prepare(
    `INSERT INTO group_conversations (id, name, owner_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(groupId, name, ownerId, now, now);

  // Add bots to group
  const insertBot = db.prepare(
    'INSERT INTO group_conversation_bots (group_conversation_id, bot_id) VALUES (?, ?)'
  );
  const insertMany = db.transaction((botIds: string[]) => {
    for (const botId of botIds) {
      insertBot.run(groupId, botId);
    }
  });
  insertMany(botIds);

  return {
    id: groupId,
    name,
    owner_id: ownerId,
    bot_ids: botIds,
    created_at: now,
    updated_at: now
  };
}

export function getGroups(userId: string): any[] {
  const groups = db
    .prepare(
      `
      SELECT
        gc.id, gc.name, gc.owner_id, gc.created_at, gc.updated_at,
        GROUP_CONCAT(gcb.bot_id) as bot_ids,
        GROUP_CONCAT(b.name) as bot_names,
        m.id as last_message_id,
        m.content as last_message_content,
        m.sender_type as last_message_sender_type,
        m.sender_id as last_message_sender_id,
        last_b.name as last_message_sender_name,
        m.created_at as last_message_created_at
      FROM group_conversations gc
      LEFT JOIN group_conversation_bots gcb ON gc.id = gcb.group_conversation_id
      LEFT JOIN bots b ON gcb.bot_id = b.id
      LEFT JOIN messages m ON gc.id = m.group_conversation_id
      LEFT JOIN bots last_b ON m.sender_id = last_b.id
      WHERE gc.owner_id = ?
      GROUP BY gc.id
      ORDER BY gc.updated_at DESC
    `
    )
    .all(userId) as any[];

  return groups.map(group => {
    const botIds = group.bot_ids ? group.bot_ids.split(',') : [];
    const botNames = group.bot_names ? group.bot_names.split(',') : [];
    const bots = botIds.map((botId: string, index: number) => ({
      id: botId,
      name: botNames[index] || `Bot ${botId.slice(0, 4)}`
    }));

    return {
      id: group.id,
      name: group.name,
      owner_id: group.owner_id,
      botIds,
      bots,
      created_at: group.created_at,
      updated_at: group.updated_at,
      lastMessage: group.last_message_id
        ? {
            id: group.last_message_id,
            content: group.last_message_content,
            sender_type: group.last_message_sender_type,
            sender_id: group.last_message_sender_id,
            sender_name: group.last_message_sender_name || 'Unknown',
            created_at: group.last_message_created_at
          }
        : undefined
    };
  });
}

export function getGroupById(groupId: string, userId: string): any | null {
  const group = db
    .prepare('SELECT * FROM group_conversations WHERE id = ? AND owner_id = ?')
    .get(groupId, userId) as any;

  if (!group) {
    return null;
  }

  const bots = getGroupBots(groupId);

  return {
    id: group.id,
    name: group.name,
    owner_id: group.owner_id,
    bots,
    created_at: group.created_at,
    updated_at: group.updated_at
  };
}

export function deleteGroup(groupId: string, userId: string): boolean {
  const group = db
    .prepare('SELECT * FROM group_conversations WHERE id = ? AND owner_id = ?')
    .get(groupId, userId) as any;

  if (!group) {
    return false;
  }

  // Messages will be cascade deleted
  db.prepare('DELETE FROM group_conversations WHERE id = ?').run(groupId);
  return true;
}

// Core logic: Send group message with bot response handling
export async function sendGroupMessage(input: SendGroupMessageInput): Promise<{
  userMessage: any;
  botMessages: any[];
}> {
  const { groupConversationId, userId, content } = input;

  // Verify group ownership
  const group = db
    .prepare('SELECT * FROM group_conversations WHERE id = ? AND owner_id = ?')
    .get(groupConversationId, userId) as any;

  if (!group) {
    throw new Error('群组不存在');
  }

  const now = new Date().toISOString();

  // Save user message
  const userMessageId = uuidv4();
  db.prepare(
    `INSERT INTO messages (id, group_conversation_id, sender_id, sender_type, content, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(userMessageId, groupConversationId, userId, 'user', content, now);

  // Get user name
  const user = db.prepare('SELECT username FROM users WHERE id = ?').get(userId) as any;

  const userMessage = {
    id: userMessageId,
    group_conversation_id: groupConversationId,
    sender_id: userId,
    sender_type: 'user' as const,
    sender_name: user?.username || 'Unknown',
    content,
    created_at: now
  };

  // Check last message to prevent bot loops
  const lastMessage = db
    .prepare(
      `SELECT sender_type FROM messages
       WHERE group_conversation_id = ?
       ORDER BY created_at DESC
       LIMIT 1`
    )
    .get(groupConversationId) as { sender_type: string } | undefined;

  // If last message was from bot, don't trigger bot responses (prevent loops)
  if (lastMessage && lastMessage.sender_type === 'bot') {
    return { userMessage, botMessages: [] };
  }

  // Get all bots in the group
  const bots = getGroupBots(groupConversationId);

  if (bots.length === 0) {
    return { userMessage, botMessages: [] };
  }

  // Trigger bot responses - at least one bot must reply
  // Strategy: All bots reply to the user message
  const botMessages: any[] = [];

  for (const bot of bots) {
    try {
      const botResponse = await callBotAI(bot.id, bot.name, content);

      if (botResponse.success && botResponse.content) {
        const botMessageId = uuidv4();
        const botNow = new Date().toISOString();
        db.prepare(
          `INSERT INTO messages (id, group_conversation_id, sender_id, sender_type, content, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).run(botMessageId, groupConversationId, bot.id, 'bot', botResponse.content, botNow);

        botMessages.push({
          id: botMessageId,
          group_conversation_id: groupConversationId,
          sender_id: bot.id,
          sender_type: 'bot' as const,
          sender_name: bot.name,
          content: botResponse.content,
          created_at: botNow
        });
      }
    } catch (error) {
      console.error(`Bot ${bot.id} response failed:`, error);
    }
  }

  // Ensure at least one bot responds (fallback)
  if (botMessages.length === 0 && bots.length > 0) {
    const fallbackBot = bots[0];
    const botMessageId = uuidv4();
    const botNow = new Date().toISOString();
    const fallbackContent = '[系统提示] 机器人暂时无法回复，请稍后再试。';

    db.prepare(
      `INSERT INTO messages (id, group_conversation_id, sender_id, sender_type, content, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(botMessageId, groupConversationId, fallbackBot.id, 'bot', fallbackContent, botNow);

    botMessages.push({
      id: botMessageId,
      group_conversation_id: groupConversationId,
      sender_id: fallbackBot.id,
      sender_type: 'bot' as const,
      sender_name: fallbackBot.name,
      content: fallbackContent,
      created_at: botNow
    });
  }

  return { userMessage, botMessages };
}

export function getGroupMessages(input: GetGroupMessagesInput): {
  data: any[];
  pagination: { total: number; page: number; limit: number };
} {
  const { groupConversationId, userId, page = 1, limit = 50 } = input;
  const offset = (page - 1) * limit;

  // Verify group ownership
  const group = db
    .prepare('SELECT * FROM group_conversations WHERE id = ? AND owner_id = ?')
    .get(groupConversationId, userId) as any;

  if (!group) {
    throw new Error('群组不存在');
  }

  // Get total count
  const countResult = db
    .prepare('SELECT COUNT(*) as count FROM messages WHERE group_conversation_id = ?')
    .get(groupConversationId) as { count: number };
  const total = countResult.count;

  // Get messages with sender names
  const messages = db
    .prepare(
      `
      SELECT
        m.*,
        u.username as sender_name,
        b.name as bot_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id AND m.sender_type = 'user'
      LEFT JOIN bots b ON m.sender_id = b.id AND m.sender_type = 'bot'
      WHERE m.group_conversation_id = ?
      ORDER BY m.created_at ASC
      LIMIT ? OFFSET ?
    `
    )
    .all(groupConversationId, limit, offset) as any[];

  const data = messages.map(m => ({
    id: m.id,
    group_conversation_id: m.group_conversation_id,
    sender_id: m.sender_id,
    sender_type: m.sender_type,
    sender_name: m.sender_type === 'user' ? m.sender_name : m.bot_name,
    content: m.content,
    created_at: m.created_at
  }));

  return {
    data,
    pagination: { total, page, limit }
  };
}
