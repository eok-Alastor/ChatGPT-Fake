import { Router, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AuthRequest } from '../types';
import { getUserTags } from '../services/conversationService';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/tags
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const tags = getUserTags(userId);
    res.status(200).json({ success: true, data: tags });
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取标签失败';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
