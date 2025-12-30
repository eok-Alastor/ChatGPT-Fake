import { Router, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AuthRequest } from '../types';
import {
  createConversation,
  getConversations,
  getConversationById,
  updateConversation,
  updateConversationTags,
  deleteConversation,
  updateConversationModel,
  getConversationModel
} from '../services/conversationService';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/conversations
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const tag = req.query.tag as string | undefined;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const result = getConversations({ userId, tag, page, limit });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取对话列表失败';
    res.status(500).json({ success: false, error: message });
  }
});

// POST /api/conversations
router.post('/', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const body = req.body as any;
    const { title, modelId } = body;

    const conversation = createConversation({ userId, title, modelId });
    res.status(201).json({ success: true, data: conversation });
  } catch (error) {
    const message = error instanceof Error ? error.message : '创建对话失败';
    res.status(500).json({ success: false, error: message });
  }
});

// GET /api/conversations/:conversationId
router.get('/:conversationId', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { conversationId } = req.params;

    const conversation = getConversationById(conversationId, userId);

    if (!conversation) {
      res.status(404).json({ success: false, error: '对话不存在' });
      return;
    }

    res.status(200).json({ success: true, data: conversation });
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取对话详情失败';
    res.status(500).json({ success: false, error: message });
  }
});

// PATCH /api/conversations/:conversationId
router.patch('/:conversationId', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { conversationId } = req.params;
    const body = req.body as any;
    const { title } = body;

    if (!title) {
      res.status(400).json({ success: false, error: '请提供标题' });
      return;
    }

    const conversation = updateConversation({ conversationId, userId, title });

    if (!conversation) {
      res.status(404).json({ success: false, error: '对话不存在' });
      return;
    }

    res.status(200).json({ success: true, data: conversation });
  } catch (error) {
    const message = error instanceof Error ? error.message : '更新对话失败';
    res.status(500).json({ success: false, error: message });
  }
});

// PATCH /api/conversations/:conversationId/tags
router.patch('/:conversationId/tags', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { conversationId } = req.params;
    const body = req.body as any;
    const { tags } = body;

    if (!Array.isArray(tags)) {
      res.status(400).json({ success: false, error: '标签必须是数组' });
      return;
    }

    const conversation = updateConversationTags({ conversationId, userId, tags });

    if (!conversation) {
      res.status(404).json({ success: false, error: '对话不存在' });
      return;
    }

    res.status(200).json({ success: true, data: conversation });
  } catch (error) {
    const message = error instanceof Error ? error.message : '更新标签失败';
    res.status(500).json({ success: false, error: message });
  }
});

// GET /api/conversations/:conversationId/model - 获取对话的模型设置
router.get('/:conversationId/model', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { conversationId } = req.params;

    const modelSetting = getConversationModel(conversationId, userId);

    if (!modelSetting) {
      res.status(404).json({ success: false, error: '对话不存在' });
      return;
    }

    res.status(200).json({ success: true, data: modelSetting });
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取模型设置失败';
    res.status(500).json({ success: false, error: message });
  }
});

// PUT /api/conversations/:conversationId/model - 更新对话的模型设置
router.put('/:conversationId/model', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { conversationId } = req.params;
    const body = req.body as any;
    const { modelId } = body;

    if (!modelId) {
      res.status(400).json({ success: false, error: '请提供模型ID' });
      return;
    }

    const conversation = updateConversationModel({ conversationId, userId, modelId });

    if (!conversation) {
      res.status(404).json({ success: false, error: '对话不存在' });
      return;
    }

    res.status(200).json({ success: true, data: { modelId: conversation.model_id } });
  } catch (error) {
    const message = error instanceof Error ? error.message : '更新模型设置失败';
    const statusCode = message.includes('不存在') || message.includes('禁用') ? 400 : 500;
    res.status(statusCode).json({ success: false, error: message });
  }
});

// DELETE /api/conversations/:conversationId
router.delete('/:conversationId', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { conversationId } = req.params;

    const deleted = deleteConversation(conversationId, userId);

    if (!deleted) {
      res.status(404).json({ success: false, error: '对话不存在' });
      return;
    }

    res.status(200).json({ success: true, message: '对话已删除' });
  } catch (error) {
    const message = error instanceof Error ? error.message : '删除对话失败';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
