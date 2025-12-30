import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../database.sqlite');
const db: Database.Database = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  -- Models table
  CREATE TABLE IF NOT EXISTS models (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    context_limit INTEGER,
    pricing_per_1k_tokens TEXT,
    is_active INTEGER DEFAULT 1
  );

  -- Conversations table (individual conversations)
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    model_id TEXT DEFAULT 'gpt-3.5-turbo',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Conversation tags table
  CREATE TABLE IF NOT EXISTS conversation_tags (
    conversation_id TEXT NOT NULL,
    tag TEXT NOT NULL,
    PRIMARY KEY (conversation_id, tag),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  );

  -- Bots table (predefined bots)
  CREATE TABLE IF NOT EXISTS bots (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    personality TEXT,
    description TEXT,
    response_tendency TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Group conversations table
  CREATE TABLE IF NOT EXISTS group_conversations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Group conversation bots mapping table
  CREATE TABLE IF NOT EXISTS group_conversation_bots (
    group_conversation_id TEXT NOT NULL,
    bot_id TEXT NOT NULL,
    PRIMARY KEY (group_conversation_id, bot_id),
    FOREIGN KEY (group_conversation_id) REFERENCES group_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE
  );

  -- Messages table (unified for both individual and group conversations)
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT,
    group_conversation_id TEXT,
    sender_id TEXT NOT NULL,
    sender_type TEXT NOT NULL CHECK(sender_type IN ('user', 'bot')),
    content TEXT NOT NULL,
    ai_error INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (group_conversation_id) REFERENCES group_conversations(id) ON DELETE CASCADE,
    CHECK (
      (conversation_id IS NOT NULL AND group_conversation_id IS NULL) OR
      (conversation_id IS NULL AND group_conversation_id IS NOT NULL)
    )
  );

  -- Create indexes for better query performance
  CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
  CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
  CREATE INDEX IF NOT EXISTS idx_messages_group_conversation_id ON messages(group_conversation_id);
  CREATE INDEX IF NOT EXISTS idx_group_conversations_owner_id ON group_conversations(owner_id);
`);

// Insert predefined bots
const insertBots = db.prepare(`
  INSERT OR IGNORE INTO bots (id, name, personality, description, response_tendency)
  VALUES (?, ?, ?, ?, ?)
`);

const bots = [
  {
    id: 'bot-cs',
    name: '客服机器人',
    personality: '友善、耐心',
    description: '专门处理客户咨询',
    response_tendency: '主动提供帮助'
  },
  {
    id: 'bot-tech',
    name: '技术机器人',
    personality: '专业、严谨',
    description: '负责技术问题解答',
    response_tendency: '详细解释技术细节'
  },
  {
    id: 'bot-funny',
    name: '幽默机器人',
    personality: '风趣、幽默',
    description: '调节气氛',
    response_tendency: '加入幽默元素'
  }
];

type BotData = Array<{
  id: string;
  name: string;
  personality: string;
  description: string;
  response_tendency: string;
}>;

const insertMany = db.transaction((bots: BotData) => {
  for (const bot of bots) {
    insertBots.run(bot.id, bot.name, bot.personality, bot.description, bot.response_tendency);
  }
});

insertMany(bots);

// Insert predefined models
const insertModels = db.prepare(`
  INSERT OR IGNORE INTO models (id, name, provider, context_limit, pricing_per_1k_tokens, is_active)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const models = [
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    context_limit: 8192,
    pricing_per_1k_tokens: '0.03',
    is_active: 1
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    context_limit: 128000,
    pricing_per_1k_tokens: '0.01',
    is_active: 1
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    context_limit: 16385,
    pricing_per_1k_tokens: '0.002',
    is_active: 1
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    context_limit: 200000,
    pricing_per_1k_tokens: '0.015',
    is_active: 1
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    provider: 'Anthropic',
    context_limit: 200000,
    pricing_per_1k_tokens: '0.003',
    is_active: 1
  }
];

type ModelData = Array<{
  id: string;
  name: string;
  provider: string;
  context_limit: number;
  pricing_per_1k_tokens: string;
  is_active: number;
}>;

const insertModelsMany = db.transaction((models: ModelData) => {
  for (const model of models) {
    insertModels.run(
      model.id,
      model.name,
      model.provider,
      model.context_limit,
      model.pricing_per_1k_tokens,
      model.is_active
    );
  }
});

insertModelsMany(models);

// Migration: Add model_id column to existing conversations table if it doesn't exist
try {
  db.prepare(`ALTER TABLE conversations ADD COLUMN model_id TEXT DEFAULT 'gpt-3.5-turbo'`).run();
  console.log('Migration: Added model_id column to conversations table');
} catch (error: unknown) {
  const err = error as Error;
  // Column already exists, ignore the error
  if (!err.message.includes('duplicate column')) {
    console.error('Migration error:', err.message);
  }
}

// Insert test users
const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (id, username, email, password_hash, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const bcrypt = require('bcryptjs');

const testUsers = [
  {
    id: 'test-user-1',
    username: 'testuser',
    email: 'test@test.com',
    password: '123456'
  },
  {
    id: 'test-user-2',
    username: 'testuser2',
    email: 'test2@test.com',
    password: '123456'
  }
];

type UserData = Array<{
  id: string;
  username: string;
  email: string;
  password: string;
}>;

const insertUsers = db.transaction((users: UserData) => {
  for (const user of users) {
    const passwordHash = bcrypt.hashSync(user.password, 10);
    insertUser.run(
      user.id,
      user.username,
      user.email,
      passwordHash,
      new Date().toISOString(),
      new Date().toISOString()
    );
  }
});

insertUsers(testUsers);

console.log('Database initialized successfully');
console.log('Predefined bots inserted:', bots.length);
console.log('Predefined models inserted:', models.length);
console.log('Test users inserted:', testUsers.length);

export default db;
