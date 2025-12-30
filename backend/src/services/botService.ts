import db from '../db/schema';
import { Bot } from '../types';

export function getAllBots(): Bot[] {
  const bots = db
    .prepare('SELECT * FROM bots ORDER BY id')
    .all() as Bot[];
  return bots;
}

export function getBotById(botId: string): Bot | null {
  const bot = db
    .prepare('SELECT * FROM bots WHERE id = ?')
    .get(botId) as Bot | undefined;
  return bot || null;
}

export function getGroupBots(groupConversationId: string): Bot[] {
  const bots = db
    .prepare(
      `
      SELECT b.* FROM bots b
      INNER JOIN group_conversation_bots gcb ON b.id = gcb.bot_id
      WHERE gcb.group_conversation_id = ?
      ORDER BY b.id
    `
    )
    .all(groupConversationId) as Bot[];
  return bots;
}
