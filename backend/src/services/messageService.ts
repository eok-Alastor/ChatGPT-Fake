import { v4 as uuidv4 } from 'uuid';
import db from '../db/schema';
import { Message } from '../types';
import { callAIWithRetry } from './aiService';

interface SendMessageInput {
  conversationId: string;
  userId: string;
  content: string;
}

interface GetMessagesInput {
  conversationId: string;
  userId: string;
  page?: number;
  limit?: number;
}

export async function sendMessage(input: SendMessageInput): Promise<{
  userMessage: Message;
  aiMessage: Message | null;
  error?: { message: string; retryable: boolean };
}> {
  const { conversationId, userId, content } = input;

  // Verify conversation ownership
  const conversation = db
    .prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?')
    .get(conversationId, userId) as any;

  if (!conversation) {
    throw new Error('对话不存在');
  }

  const now = new Date().toISOString();

  // Save user message
  const userMessageId = uuidv4();
  db.prepare(
    `INSERT INTO messages (id, conversation_id, sender_id, sender_type, content, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(userMessageId, conversationId, userId, 'user', content, now);

  const userMessage: Message = {
    id: userMessageId,
    conversation_id: conversationId,
    sender_id: userId,
    sender_type: 'user',
    content,
    ai_error: 0,
    created_at: now
  };

  // Try to get AI response
  try {
    const modelId = conversation.model_id || 'gpt-3.5-turbo';
    const aiResponse = await callAIWithRetry(content, modelId);

    if (aiResponse.success && aiResponse.content) {
      // Save AI message
      const aiMessageId = uuidv4();
      const aiNow = new Date().toISOString();
      db.prepare(
        `INSERT INTO messages (id, conversation_id, sender_id, sender_type, content, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(aiMessageId, conversationId, 'bot-ai', 'bot', aiResponse.content, aiNow);

      const aiMessage: Message = {
        id: aiMessageId,
        conversation_id: conversationId,
        sender_id: 'bot-ai',
        sender_type: 'bot',
        content: aiResponse.content,
        ai_error: 0,
        created_at: aiNow
      };

      return { userMessage, aiMessage };
    } else {
      // AI call failed after retries - save error marker
      const aiMessageId = uuidv4();
      const aiNow = new Date().toISOString();
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
        aiResponse.error || '未知错误',
        aiNow
      );

      return {
        userMessage,
        aiMessage: null,
        error: {
          message: aiResponse.error || 'AI服务暂时不可用，请稍后再试',
          retryable: true
        }
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI调用失败';

    return {
      userMessage,
      aiMessage: null,
      error: {
        message,
        retryable: true
      }
    };
  }
}

export function getMessages(input: GetMessagesInput): {
  data: Message[];
  pagination: { total: number; page: number; limit: number };
} {
  const { conversationId, userId, page = 1, limit = 50 } = input;
  const offset = (page - 1) * limit;

  // Verify conversation ownership
  const conversation = db
    .prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?')
    .get(conversationId, userId) as any;

  if (!conversation) {
    throw new Error('对话不存在');
  }

  // Get total count
  const countResult = db
    .prepare('SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?')
    .get(conversationId) as { count: number };
  const total = countResult.count;

  // Get messages
  const messages = db
    .prepare(
      `SELECT * FROM messages
       WHERE conversation_id = ?
       ORDER BY created_at ASC
       LIMIT ? OFFSET ?`
    )
    .all(conversationId, limit, offset) as Message[];

  return {
    data: messages,
    pagination: { total, page, limit }
  };
}
