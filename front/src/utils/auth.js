// 认证相关的工具函数
export const authUtils = {
  // 保存 token 和用户信息
  saveAuth: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  // 获取 token
  getToken: () => {
    return localStorage.getItem('token');
  },

  // 获取用户信息
  getUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // 清除认证信息
  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // 检查是否已登录
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};
