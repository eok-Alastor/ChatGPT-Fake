import type { Request } from 'express';

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface Bot {
  id: string;
  name: string;
  personality: string;
  description: string;
  response_tendency: string;
  created_at: string;
}

export interface Model {
  id: string;
  name: string;
  provider: string;
  context_limit: number;
  pricing_per_1k_tokens: string;
  is_active: number;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  model_id: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationWithTags extends Conversation {
  tags: string[];
}

export interface ConversationWithLastMessage extends ConversationWithTags {
  lastMessage?: {
    id: string;
    content: string;
    created_at: string;
  };
}

export interface GroupConversation {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id?: string;
  group_conversation_id?: string;
  sender_id: string;
  sender_type: 'user' | 'bot';
  content: string;
  ai_error: number;
  error_message?: string;
  created_at: string;
}

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
}

export interface AIResponse {
  content: string;
  success: boolean;
  error?: string;
}
