/**
 * API 服务封装层
 * 基于 OpenAPI Generator 生成的代码
 */

import {
  AuthApi,
  ConversationsApi,
  MessagesApi,
  BotsApi,
  GroupsApi,
  TagsApi,
  Configuration,
} from '../api-generated';

// 创建 API 配置
const createApiConfig = () => {
  const config = new Configuration();
  // 从环境变量或默认值获取 base path
  config.basePath = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  return config;
};

// 获取配置（动态添加 token）
const getConfigWithAuth = () => {
  const config = createApiConfig();
  const token = localStorage.getItem('token');

  if (token) {
    config.accessToken = token;
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  return config;
};

// 创建 API 实例
export const createAuthApi = () => new AuthApi(createApiConfig());
export const createConversationsApi = () => new ConversationsApi(getConfigWithAuth());
export const createMessagesApi = () => new MessagesApi(getConfigWithAuth());
export const createBotsApi = () => new BotsApi(getConfigWithAuth());
export const createGroupsApi = () => new GroupsApi(getConfigWithAuth());
export const createTagsApi = () => new TagsApi(getConfigWithAuth());

// 导出类型
export * from '../api-generated';
