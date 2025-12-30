import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import { AuthRequest, JWTPayload } from '../types';

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = (req.headers as any)['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ success: false, error: '未提供认证令牌' });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ success: false, error: '服务器配置错误' });
    return;
  }

  jwt.verify(token, secret, (err: unknown, decoded: string | JwtPayload | undefined) => {
    if (err) {
      res.status(403).json({ success: false, error: '无效或过期的令牌' });
      return;
    }

    const payload = decoded as JWTPayload;
    req.userId = payload.userId;
    req.userEmail = payload.email;
    next();
  });
}
