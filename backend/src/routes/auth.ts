import { Router, Response, Request } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AuthRequest } from '../types';
import { register, login, getCurrentUser } from '../services/authService';

const router = Router();

// POST /api/auth/register
router.post('/register', (req: Request, res: Response) => {
  try {
    const body = req.body as any;
    const { username, email, password } = body;

    if (!username || !email || !password) {
      res.status(400).json({ success: false, error: '请提供用户名、邮箱和密码' });
      return;
    }

    const result = register({ username, email, password });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : '注册失败';
    res.status(400).json({ success: false, error: message });
  }
});

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  try {
    const body = req.body as any;
    const { email, password } = body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: '请提供邮箱和密码' });
      return;
    }

    const result = login({ email, password });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : '登录失败';
    res.status(401).json({ success: false, error: message });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: '未授权' });
      return;
    }

    const user = getCurrentUser(req.userId);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取用户信息失败';
    res.status(400).json({ success: false, error: message });
  }
});

export default router;
