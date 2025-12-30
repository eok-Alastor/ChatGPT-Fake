import axios from 'axios';

// 创建 axios 实例
const api = axios.create({
  baseURL: '/api', // 使用相对路径，通过 Vite 代理转发
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加 token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误和成功响应
api.interceptors.response.use(
  (response) => {
    // 处理 304 Not Modified
    if (response.status === 304 && response.data === undefined) {
      console.warn('收到 304 响应，尝试使用缓存数据');
    }
    // 返回响应数据
    return response.data;
  },
  (error) => {
    if (error.response) {
      // 服务器返回错误
      const { status, data } = error.response;

      console.error('API 错误:', {
        url: error.config?.url,
        method: error.config?.method,
        status,
        data
      });

      if (status === 401) {
        // 未授权，清除 token 并跳转到登录页
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }

      return Promise.reject({
        message: data?.error || '请求失败',
        status,
        ...data,
      });
    } else if (error.request) {
      // 请求已发出但没有响应
      console.error('网络错误:', error.message);
      return Promise.reject({
        message: '网络连接失败，请检查网络设置',
        isNetworkError: true,
      });
    } else {
      // 其他错误
      console.error('未知错误:', error.message);
      return Promise.reject({
        message: error.message || '发生未知错误',
      });
    }
  }
);

// ==================== 认证相关 API ====================
export const authAPI = {
  // 注册
  register: (data) => api.post('/auth/register', data),

  // 登录
  login: (data) => api.post('/auth/login', data),

  // 获取当前用户信息
  getCurrentUser: () => api.get('/auth/me'),
};

// ==================== 模型相关 API ====================
export const modelAPI = {
  // 获取所有可用模型
  getAll: () => api.get('/models'),
};

// ==================== 个人对话相关 API ====================
export const conversationAPI = {
  // 创建对话（支持指定 modelId）
  create: (data) => api.post('/conversations', data),

  // 获取所有对话
  getAll: (params) => api.get('/conversations', { params }),

  // 获取对话详情
  getById: (conversationId) => api.get(`/conversations/${conversationId}`),

  // 获取对话的模型设置
  getModel: (conversationId) => api.get(`/conversations/${conversationId}/model`),

  // 更新对话的模型设置
  updateModel: (conversationId, modelId) =>
    api.put(`/conversations/${conversationId}/model`, { modelId }),

  // 更新对话标题
  updateTitle: (conversationId, title) =>
    api.patch(`/conversations/${conversationId}`, { title }),

  // 更新对话标签
  updateTags: (conversationId, tags) =>
    api.patch(`/conversations/${conversationId}/tags`, { tags }),

  // 删除对话
  delete: (conversationId) => api.delete(`/conversations/${conversationId}`),

  // 发送消息
  sendMessage: (conversationId, content) => {
    return api.post(`/conversations/${conversationId}/messages`, { content });
  },

  // 发送流式消息（SSE）
  sendMessageStream: async (conversationId, content, onChunk) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/conversations/${conversationId}/messages/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留不完整的行

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              onChunk(data);
            } catch (e) {
              console.error('[SSE] 解析失败:', line, e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },

  // 获取消息列表
  getMessages: (conversationId, params) =>
    api.get(`/conversations/${conversationId}/messages`, { params }),
};

// ==================== 群组对话相关 API ====================
export const groupConversationAPI = {
  // 获取所有可用机器人
  getBots: () => api.get('/bots'),

  // 创建群组
  create: (data) => api.post('/group-conversations', data),

  // 获取所有群组
  getAll: () => api.get('/group-conversations'),

  // 获取群组详情
  getById: (groupId) => api.get(`/group-conversations/${groupId}`),

  // 发送群组消息
  sendMessage: (groupId, content) =>
    api.post(`/group-conversations/${groupId}/messages`, { content }),

  // 发送流式群组消息（SSE）
  sendMessageStream: async (groupId, content, onChunk) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/group-conversations/${groupId}/messages/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              onChunk(data);
            } catch (e) {
              console.error('[SSE] 解析失败:', line, e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },

  // 获取群组消息历史
  getMessages: (groupId, params) =>
    api.get(`/group-conversations/${groupId}/messages`, { params }),

  // 删除群组
  delete: (groupId) => api.delete(`/group-conversations/${groupId}`),
};

// ==================== 标签相关 API ====================
export const tagAPI = {
  // 获取用户使用过的所有标签
  getAll: () => api.get('/tags'),
};

export default api;
