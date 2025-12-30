import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupConversationAPI } from '../services/api';
import {
  ArrowLeft,
  Send,
  Trash2,
  Bot,
  User,
  Users,
  AlertCircle,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatTime } from '../utils/time';

export default function GroupChatPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // 确认对话框状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 加载群组详情
  const loadGroup = useCallback(async () => {
    try {
      const response = await groupConversationAPI.getById(groupId);
      setGroup(response.data);
    } catch (error) {
      console.error('加载群组详情失败:', error);
    }
  }, [groupId]);

  // 加载消息列表
  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await groupConversationAPI.getMessages(groupId, {
        limit: 100,
      });
      setMessages(response.data);
    } catch (error) {
      console.error('加载消息失败:', error);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadGroup();
    loadMessages();
  }, [groupId]);

  // 当页面重新获得焦点时刷新群组信息
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadGroup();
      }
    };

    const handleFocus = () => {
      loadGroup();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadGroup]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 发送消息
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || sending) return;

    const userMessageContent = inputValue.trim();
    setInputValue('');
    setSending(true);

    // 添加用户消息
    const userMessage = {
      id: Date.now(),
      sender_type: 'user',
      content: userMessageContent,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMessage]);

    // 用于跟踪流式消息的映射
    const streamingMessages = new Map();

    try {
      await groupConversationAPI.sendMessageStream(
        groupId,
        userMessageContent,
        (data) => {
          console.log('[SSE] 收到事件:', data.type, data);

          switch (data.type) {
            case 'userMessage':
              // 用户消息已保存，更新 ID
              setMessages((prev) => prev.map(msg =>
                msg.id === userMessage.id
                  ? { ...msg, id: data.data.id }
                  : msg
              ));
              break;

            case 'aiMessageStart':
              // AI 消息开始，创建占位符
              const streamingId = 'streaming-' + data.data.id;
              streamingMessages.set(data.data.id, streamingId);
              setMessages((prev) => [...prev, {
                id: streamingId,
                sender_type: 'bot',
                sender_id: data.data.sender_id,
                sender_name: data.data.sender_name,
                content: '',
                created_at: new Date().toISOString(),
                streaming: true
              }]);
              break;

            case 'aiMessageChunk':
              // 追加内容
              const messageId = data.data.messageId;
              const actualId = streamingMessages.get(messageId) || messageId;
              setMessages((prev) => prev.map(msg =>
                msg.id === actualId
                  ? { ...msg, content: (msg.content || '') + data.data.content }
                  : msg
              ));
              break;

            case 'aiMessageEnd':
              // 消息完成
              const finalId = streamingMessages.get(data.data.messageId) || data.data.messageId;
              setMessages((prev) => prev.map(msg =>
                msg.id === finalId || msg.streaming
                  ? { ...msg, streaming: false, content: data.data.content }
                  : msg
              ));
              streamingMessages.delete(data.data.messageId);
              break;

            case 'error':
              console.error('[SSE] 错误:', data.message);
              break;
          }
        }
      );
    } catch (error) {
      console.error('发送消息失败:', error);
      setMessages((prev) => prev.map(msg =>
        msg.streaming
          ? { ...msg, streaming: false, content: '发送失败，请重试', ai_error: true }
          : msg
      ));
    } finally {
      setSending(false);
    }
  };

  // 删除群组
  const handleDelete = async () => {
    // 显示确认对话框
    setShowDeleteConfirm(true);
  };

  // 确认删除
  const confirmDelete = async () => {
    try {
      await groupConversationAPI.delete(groupId);
      setShowDeleteConfirm(false);
      // 触发自定义事件，通知 ConversationList 刷新
      window.dispatchEvent(new CustomEvent('conversation-updated'));
      navigate('/groups');
    } catch (error) {
      console.error('删除群组失败:', error);
      alert('删除群组失败: ' + (error.message || '未知错误'));
    }
  };

  // 取消删除
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  // 获取发送者头像颜色
  const getAvatarColor = (senderId, senderType) => {
    if (senderType === 'user') return 'bg-gray-500 dark:bg-gray-600';
    // 根据机器人ID生成固定的颜色
    const colors = [
      'bg-blue-600',
      'bg-green-600',
      'bg-purple-600',
      'bg-pink-600',
      'bg-yellow-600',
      'bg-red-600',
    ];
    const index =
      (senderId || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      colors.length;
    return colors[index];
  };

  if (loading && messages.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 overflow-hidden">
      {/* 顶部栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={() => navigate('/groups')}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <ArrowLeft size={20} className="text-gray-700 dark:text-gray-300" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-600/20 flex items-center justify-center">
              <Users className="text-purple-600 dark:text-purple-500" size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">{group?.name}</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {group?.bots?.length || 0} 个机器人
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
          title="删除群组"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* 机器人列表 */}
      {group?.bots && group.bots.length > 0 && (
        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Bot size={16} />
            <span>群组成员：</span>
            <div className="flex flex-wrap gap-1">
              {group.bots.map((bot) => (
                <span
                  key={bot.id}
                  className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
                >
                  {bot.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">开始群组对话...</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.sender_type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.sender_type === 'bot' && (
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full ${getAvatarColor(
                      message.sender_id,
                      message.sender_type
                    )} flex items-center justify-center`}
                  >
                    <Bot size={18} className="text-white" />
                  </div>
                )}
                <div className="max-w-[75%]">
                  {message.sender_type === 'bot' && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {message.sender_name}
                      </span>
                    </div>
                  )}
                  {message.sender_type === 'user' && (
                    <div className="flex items-center justify-end gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        您
                      </span>
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2.5 ${
                      message.ai_error
                        ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words leading-relaxed">
                      {message.content}
                      {message.streaming && (
                        <span className="inline-block w-0.5 h-4 ml-0.5 bg-gray-900 dark:bg-white animate-pulse align-middle" />
                      )}
                    </p>
                    {message.ai_error && message.error_message && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-red-600 dark:text-red-300">
                        <AlertCircle size={12} />
                        {message.error_message}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                {message.sender_type === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 dark:bg-gray-700 flex items-center justify-center">
                    <User size={18} className="text-white" />
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <Bot size={18} className="text-gray-600 dark:text-gray-300" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2.5">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce delay-100" />
                    <span className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="输入消息..."
            disabled={sending}
            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || sending}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition flex items-center gap-2"
          >
            <Send size={20} />
            发送
          </button>
        </div>
      </form>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        show={showDeleteConfirm}
        title="是否删除？"
        message="确定要删除这个群组吗？删除后将无法恢复。"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}
