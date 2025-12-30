import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { authUtils } from '../utils/auth';
import {
  MessageSquare,
  Users,
  LogOut,
  Sun,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import ConversationList from './ConversationList';

export default function Layout() {
  const navigate = useNavigate();
  const user = authUtils.getUser();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('conversations');

  const handleLogout = () => {
    authUtils.clearAuth();
    navigate('/login');
  };

  return (
    <div className="h-screen flex bg-white dark:bg-gray-900 overflow-hidden">
      {/* 左侧边栏 */}
      <aside className="w-64 h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        {/* Logo */}
        <div className="p-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition w-full"
          >
            <div className="w-8 h-8 rounded-md bg-black dark:bg-white flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white dark:text-black">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
                <path d="M12 6V12L16 14" fill="currentColor" className="text-white dark:text-black"/>
              </svg>
            </div>
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">ChatGPT-Fake</span>
          </button>
        </div>

        {/* 个人对话/群组对话 切换 */}
        <div className="px-3 py-2 space-y-1">
          <button
            onClick={() => setActiveTab('conversations')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition text-sm ${
              activeTab === 'conversations'
                ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
            }`}
          >
            <MessageSquare size={16} />
            <span>个人对话</span>
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition text-sm ${
              activeTab === 'groups'
                ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
            }`}
          >
            <Users size={16} />
            <span>群组对话</span>
          </button>
        </div>

        {/* 对话/群组列表 */}
        <div className="flex-1 px-3">
          <ConversationList activeTab={activeTab} />
        </div>

        {/* 底部用户区域 */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-1">
          {/* 样式切换 */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition w-full text-sm text-gray-700 dark:text-gray-200"
          >
            {theme === 'dark' ? <Sun size={16} /> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>}
            <span>{theme === 'dark' ? '浅色模式' : '深色模式'}</span>
          </button>

          {/* 用户信息容器 */}
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
              {user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate flex-1">
              {user?.username || '用户'}
            </span>
            <button
              onClick={handleLogout}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition"
              title="登出"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* 右侧内容区域 */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
