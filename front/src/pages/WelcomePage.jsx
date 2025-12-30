import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { conversationAPI } from '../services/api';
import ChatInput from '../components/ChatInput';

export default function WelcomePage() {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (firstMessage) => {
    if (!firstMessage?.trim() || creating) return;

    setInputValue('');
    setCreating(true);

    try {
      const response = await conversationAPI.create({});
      const conversationId = response.data.id;

      navigate(`/chat/${conversationId}`, {
        state: { firstMessage: firstMessage.trim() },
      });
    } catch (error) {
      console.error('创建对话失败:', error);
      setCreating(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(inputValue);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center px-6">
      {/* 居中内容 */}
      <div className="w-full max-w-3xl">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            您今天在想什么？
          </h1>
        </div>

        {/* 圆角输入框容器 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-300 dark:border-gray-600 p-1">
          <ChatInput
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onSubmit={() => handleSubmit(inputValue)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息开始对话..."
            disabled={creating}
            showHint={false}
            containerClassName="border-none shadow-none"
          />
        </div>
      </div>
    </div>
  );
}
