import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import db from '../db/schema';
import { User } from '../types';

const SALT_ROUNDS = 10;

interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
    created_at: string;
    updated_at: string;
  };
  token: string;
}

function generateToken(userId: string, email: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ userId, email }, secret, { expiresIn } as SignOptions);
}

export function register(input: RegisterInput): AuthResponse {
  const { username, email, password } = input;

  // Validate input
  if (!username || username.length < 2 || username.length > 50) {
    throw new Error('用户名长度必须在2-50个字符之间');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    throw new Error('邮箱格式不正确');
  }

  if (!password || password.length < 6) {
    throw new Error('密码长度至少为6位');
  }

  // Check if user already exists
  const existingUser = db
    .prepare('SELECT id FROM users WHERE email = ? OR username = ?')
    .get(email, username) as { id: string } | undefined;

  if (existingUser) {
    throw new Error('邮箱或用户名已存在');
  }

  // Hash password
  const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);

  // Create user
  const userId = uuidv4();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO users (id, username, email, password_hash, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(userId, username, email, passwordHash, now, now);

  const user = db
    .prepare('SELECT id, username, email, created_at, updated_at FROM users WHERE id = ?')
    .get(userId) as User;

  const token = generateToken(user.id, user.email);

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at
    },
    token
  };
}

export function login(input: LoginInput): AuthResponse {
  const { email, password } = input;

  if (!email || !password) {
    throw new Error('邮箱和密码不能为空');
  }

  // Find user
  const user = db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(email) as User | undefined;

  if (!user) {
    throw new Error('邮箱或密码错误');
  }

  // Verify password
  const isValidPassword = bcrypt.compareSync(password, user.password_hash);
  if (!isValidPassword) {
    throw new Error('邮箱或密码错误');
  }

  const token = generateToken(user.id, user.email);

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at
    },
    token
  };
}

export function getCurrentUser(userId: string): Omit<User, 'password_hash'> {
  const user = db
    .prepare('SELECT id, username, email, created_at, updated_at FROM users WHERE id = ?')
    .get(userId) as User | undefined;

  if (!user) {
    throw new Error('用户不存在');
  }

  return user;
}
