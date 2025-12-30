import { v4 as uuidv4 } from 'uuid';
import db from '../db/schema';
import { ConversationWithTags, ConversationWithLastMessage } from '../types';

interface CreateConversationInput {
  userId: string;
  title?: string;
  modelId?: string;
}

interface UpdateConversationInput {
  conversationId: string;
  userId: string;
  title?: string;
}

interface UpdateTagsInput {
  conversationId: string;
  userId: string;
  tags: string[];
}

interface GetConversationsInput {
  userId: string;
  tag?: string;
  page?: number;
  limit?: number;
}

export function createConversation(input: CreateConversationInput): ConversationWithTags {
  const { userId, title, modelId = 'gpt-3.5-turbo' } = input;
  const conversationId = uuidv4();
  const now = new Date().toISOString();
  const defaultTitle = title || '新对话';

  db.prepare(
    `INSERT INTO conversations (id, user_id, title, model_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(conversationId, userId, defaultTitle, modelId, now, now);

  return {
    id: conversationId,
    user_id: userId,
    title: defaultTitle,
    model_id: modelId,
    tags: [],
    created_at: now,
    updated_at: now
  };
}

export function getConversations(input: GetConversationsInput): {
  data: ConversationWithLastMessage[];
  pagination: { total: number; page: number; limit: number };
} {
  const { userId, tag, page = 1, limit = 20 } = input;
  const offset = (page - 1) * limit;

  let query = `
    SELECT
      c.id, c.user_id, c.title, c.model_id, c.created_at, c.updated_at,
      GROUP_CONCAT(ct.tag) as tags,
      m.id as last_message_id,
      m.content as last_message_content,
      m.created_at as last_message_created_at
    FROM conversations c
    LEFT JOIN conversation_tags ct ON c.id = ct.conversation_id
    LEFT JOIN messages m ON c.id = m.conversation_id AND m.id = (
      SELECT id FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1
    )
  `;

  const params: (string | number)[] = [];

  // Add WHERE clause
  const conditions: string[] = ['c.user_id = ?'];
  params.push(userId);

  if (tag) {
    conditions.push('EXISTS (SELECT 1 FROM conversation_tags ct2 WHERE ct2.conversation_id = c.id AND ct2.tag = ?)');
    params.push(tag);
  }

  query += ' WHERE ' + conditions.join(' AND ');

  // Get total count
  const countQuery = `SELECT COUNT(DISTINCT c.id) as count FROM conversations c WHERE ${conditions.join(' AND ')}`;
  const countResult = db.prepare(countQuery).get(...params.slice(0, conditions.length)) as { count: number };
  const total = countResult.count;

  query += `
    GROUP BY c.id
    ORDER BY c.updated_at DESC
    LIMIT ? OFFSET ?
  `;
  params.push(limit, offset);

  const rows = db.prepare(query).all(...params) as any[];

  const data: ConversationWithLastMessage[] = rows.map(row => ({
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    model_id: row.model_id,
    tags: row.tags ? row.tags.split(',') : [],
    created_at: row.created_at,
    updated_at: row.updated_at,
    lastMessage: row.last_message_id
      ? {
          id: row.last_message_id,
          content: row.last_message_content,
          created_at: row.last_message_created_at
        }
      : undefined
  }));

  return {
    data,
    pagination: { total, page, limit }
  };
}

export function getConversationById(conversationId: string, userId: string): ConversationWithTags | null {
  const conversation = db
    .prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?')
    .get(conversationId, userId) as any;

  if (!conversation) {
    return null;
  }

  const tags = db
    .prepare('SELECT tag FROM conversation_tags WHERE conversation_id = ?')
    .all(conversationId) as { tag: string }[];

  return {
    id: conversation.id,
    user_id: conversation.user_id,
    title: conversation.title,
    model_id: conversation.model_id,
    tags: tags.map(t => t.tag),
    created_at: conversation.created_at,
    updated_at: conversation.updated_at
  };
}

export function updateConversation(input: UpdateConversationInput): ConversationWithTags | null {
  const { conversationId, userId, title } = input;

  // Check ownership
  const conversation = db
    .prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?')
    .get(conversationId, userId) as any;

  if (!conversation) {
    return null;
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?').run(
    title,
    now,
    conversationId
  );

  return getConversationById(conversationId, userId);
}

export function updateConversationTags(input: UpdateTagsInput): ConversationWithTags | null {
  const { conversationId, userId, tags } = input;

  // Check ownership
  const conversation = db
    .prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?')
    .get(conversationId, userId) as any;

  if (!conversation) {
    return null;
  }

  // Delete existing tags
  db.prepare('DELETE FROM conversation_tags WHERE conversation_id = ?').run(conversationId);

  // Insert new tags
  const insertTag = db.prepare('INSERT INTO conversation_tags (conversation_id, tag) VALUES (?, ?)');
  const insertMany = db.transaction((tags: string[]) => {
    for (const tag of tags) {
      if (tag.trim()) {
        insertTag.run(conversationId, tag.trim());
      }
    }
  });
  insertMany(tags);

  // Update timestamp
  const now = new Date().toISOString();
  db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(now, conversationId);

  return getConversationById(conversationId, userId);
}

export function deleteConversation(conversationId: string, userId: string): boolean {
  const conversation = db
    .prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?')
    .get(conversationId, userId) as any;

  if (!conversation) {
    return false;
  }

  // Messages will be cascade deleted due to foreign key constraint
  db.prepare('DELETE FROM conversations WHERE id = ?').run(conversationId);
  return true;
}

export function getUserTags(userId: string): { name: string; count: number }[] {
  const rows = db
    .prepare(
      `
      SELECT ct.tag, COUNT(DISTINCT ct.conversation_id) as count
      FROM conversation_tags ct
      INNER JOIN conversations c ON ct.conversation_id = c.id
      WHERE c.user_id = ?
      GROUP BY ct.tag
      ORDER BY count DESC
    `
    )
    .all(userId) as { tag: string; count: number }[];

  return rows.map(row => ({ name: row.tag, count: row.count }));
}

// Model-related functions

interface UpdateConversationModelInput {
  conversationId: string;
  userId: string;
  modelId: string;
}

export function updateConversationModel(input: UpdateConversationModelInput): ConversationWithTags | null {
  const { conversationId, userId, modelId } = input;

  // Check ownership
  const conversation = db
    .prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?')
    .get(conversationId, userId) as any;

  if (!conversation) {
    return null;
  }

  // Verify model exists
  const model = db.prepare('SELECT id FROM models WHERE id = ? AND is_active = 1').get(modelId);
  if (!model) {
    throw new Error('模型不存在或已禁用');
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE conversations SET model_id = ?, updated_at = ? WHERE id = ?').run(
    modelId,
    now,
    conversationId
  );

  return getConversationById(conversationId, userId);
}

export function getConversationModel(conversationId: string, userId: string): { modelId: string } | null {
  const conversation = db
    .prepare('SELECT model_id FROM conversations WHERE id = ? AND user_id = ?')
    .get(conversationId, userId) as any;

  if (!conversation) {
    return null;
  }

  return {
    modelId: conversation.model_id
  };
}
