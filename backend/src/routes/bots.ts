import { Router, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getAllBots } from '../services/botService';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/bots
router.get('/', (_req: unknown, res: Response) => {
  try {
    const bots = getAllBots();
    res.status(200).json({ success: true, data: bots });
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取机器人列表失败';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
