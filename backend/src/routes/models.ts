import { Router, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getAllModels } from '../services/modelService';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/models - 获取可用模型列表
router.get('/', (_req: unknown, res: Response) => {
  try {
    const models = getAllModels();
    res.status(200).json({ success: true, data: models });
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取模型列表失败';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
