import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { conversationAPI, tagAPI, modelAPI } from '../services/api';
import { Trash2, Tag, Plus, X, Bot, User, AlertCircle, ChevronDown } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import ChatInput from '../components/ChatInput';
import { formatTime } from '../utils/time';

export default function ChatPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef(null);

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [tags, setTags] = useState([]);

  // 模型选择相关状态
  const [selectedModel, setSelectedModel] = useState(null);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [models, setModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(true);

  // 确认对话框状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 防止重复发送第一条消息的标志
  const hasSentFirstMessage = useRef(false);

  // 追踪当前流式消息的 ID 映射（streamingId -> messageId）
  const streamingMessageMap = useRef(new Map());

  // 加载对话详情
  const loadConversation = async () => {
    try {
      const response = await conversationAPI.getById(conversationId);
      setConversation(response.data);
      setTags(response.data.tags || []);

      // 加载对话的模型设置
      try {
        const modelResponse = await conversationAPI.getModel(conversationId);
        setSelectedModel(modelResponse.modelId || modelResponse.data?.modelId);
      } catch (modelError) {
        console.error('加载对话模型失败:', modelError);
        // 如果获取模型失败，使用默认值
        setSelectedModel('gpt-3.5-turbo');
      }
    } catch (error) {
      console.error('加载对话详情失败:', error);
    }
  };

  // 加载可用模型列表
  const loadModels = async () => {
    try {
      setLoadingModels(true);
      const response = await modelAPI.getAll();

      // 处理响应数据（兼容不同的响应格式）
      const modelsData = response.data || response;

      if (Array.isArray(modelsData)) {
        setModels(modelsData);
      } else {
        console.error('模型列表格式错误:', modelsData);
        setModels([]);
      }
    } catch (error) {
      console.error('加载模型列表失败:', error);
      console.error('错误详情:', {
        message: error.message,
        status: error.status,
        response: error.response
      });
      alert('加载模型列表失败: ' + (error.message || '未知错误'));
      setModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  // 加载消息列表
  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await conversationAPI.getMessages(conversationId, {
        limit: 100,
      });
      setMessages(response.data);
    } catch (error) {
      console.error('加载消息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadConversation();
    loadModels(); // 加载可用模型列表

    // 重置标志位（切换到新对话时）
    hasSentFirstMessage.current = false;

    // 如果有第一条消息，不加载历史消息（避免覆盖）
    if (!location.state?.firstMessage) {
      loadMessages();
    }
  }, [conversationId]);

  // 处理从欢迎页面传来的第一条消息
  useEffect(() => {
    // 只在第一次且有消息时发送，防止刷新页面重复提交
    if (
      location.state?.firstMessage &&
      !hasSentFirstMessage.current
    ) {
      const firstMessage = location.state.firstMessage;

      // 标记已发送（必须在发送前）
      hasSentFirstMessage.current = true;

      // 清除 location.state，防止刷新时重复提交
      window.history.replaceState({}, '', location.pathname);

      // 设置发送状态
      setSending(true);

      // 添加用户消息和 AI 消息占位符（流式状态）
      const timestamp = Date.now();
      const userMessage = {
        id: `user-${timestamp}`,
        sender_type: 'user',
        content: firstMessage,
        created_at: new Date().toISOString()
      };
      const streamingId = `streaming-${timestamp}`;

      // 一次性设置两条消息，避免状态批处理问题
      streamingMessageMap.current.clear();
      streamingMessageMap.current.set(streamingId, true);
      setMessages([userMessage, {
        id: streamingId,
        sender_type: 'bot',
        content: '',
        created_at: new Date().toISOString(),
        streaming: true
      }]);

      // 使用流式接口发送消息
      conversationAPI.sendMessageStream(conversationId, firstMessage, (data) => {
        // 使用 setTimeout 延迟状态更新，避免 React 批处理导致的状态覆盖
        setTimeout(() => {
          switch (data.type) {
            case 'userMessage':
              // 用户消息已保存，更新 ID
              setMessages((prev) => prev.map(msg =>
                msg.id === userMessage.id || msg.id.startsWith('user-')
                  ? { ...msg, id: data.data.id }
                  : msg
              ));
              break;

            case 'aiMessageStart':
              // AI 消息开始，更新 ID 并建立映射
              streamingMessageMap.current.set(data.data.id, true);
              streamingMessageMap.current.delete(streamingId);
              setMessages((prev) => prev.map(msg => {
                if (msg.id === streamingId) {
                  return { ...msg, id: data.data.id, streaming: true };
                }
                return msg;
              }));
              break;

            case 'aiMessageChunk':
              // 追加内容
              const messageId = data.data.messageId;
              const content = data.data.content;
              setMessages((prev) =>
                prev.map(msg => {
                  const isStreamingMessage = streamingMessageMap.current.has(msg.id) || msg.streaming;
                  const shouldUpdate = msg.id === messageId || isStreamingMessage;
                  if (shouldUpdate) {
                    return { ...msg, content: (msg.content || '') + content };
                  }
                  return msg;
                })
              );
              break;

            case 'aiMessageEnd':
              // 消息完成
              setMessages((prev) => prev.map(msg => {
                const isStreamingMessage = streamingMessageMap.current.has(msg.id) || msg.streaming;
                if (msg.id === data.data.messageId || isStreamingMessage) {
                  return { ...msg, streaming: false, content: data.data.content };
                }
                return msg;
              }));
              setSending(false);
              break;

            case 'error':
              console.error('[ChatPage SSE] 错误:', data.message);
              setMessages((prev) => prev.map(msg =>
                msg.streaming
                  ? { ...msg, streaming: false, content: '发送失败，请重试', ai_error: true }
                  : msg
              ));
              setSending(false);
              break;

            case 'done':
              streamingMessageMap.current.clear();
              setSending(false);
              break;
          }
        }, 0);
      }).catch((error) => {
        console.error('发送第一条消息失败:', error);
        streamingMessageMap.current.clear();
        setSending(false);
        hasSentFirstMessage.current = false;
        setMessages((prev) => prev.map(msg =>
          msg.streaming
            ? { ...msg, streaming: false, content: '发送失败，请重试', ai_error: true }
            : msg
        ));
      });
    }
    // 移除 messages.length 依赖，只依赖 location.state 和 conversationId
  }, [location.state?.firstMessage, conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 发送消息
  const handleSendMessage = async (messageContent = null) => {
    const userMessageContent = messageContent || inputValue;
    if (!userMessageContent.trim() || sending) return;

    setInputValue('');
    setSending(true);

    // 添加用户消息
    const userMessage = {
      id: Date.now(),
      sender_type: 'user',
      content: userMessageContent.trim(),
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMessage]);

    // 创建 AI 消息占位符（流式状态）
    const streamingId = 'streaming-' + Date.now();
    setMessages((prev) => [...prev, {
      id: streamingId,
      sender_type: 'bot',
      content: '',
      created_at: new Date().toISOString(),
      streaming: true
    }]);

    try {
      await conversationAPI.sendMessageStream(
        conversationId,
        userMessageContent.trim(),
        (data) => {
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
              // AI 消息开始，更新 ID
              setMessages((prev) => prev.map(msg =>
                msg.id === streamingId || msg.streaming
                  ? { ...msg, id: data.data.id }
                  : msg
              ));
              break;

            case 'aiMessageChunk':
              // 追加内容
              setMessages((prev) => prev.map(msg =>
                msg.streaming || msg.id === data.data.messageId
                  ? { ...msg, content: (msg.content || '') + data.data.content }
                  : msg
              ));
              break;

            case 'aiMessageEnd':
              // 消息完成
              setMessages((prev) => prev.map(msg =>
                msg.streaming || msg.id === data.data.messageId
                  ? { ...msg, streaming: false, content: data.data.content }
                  : msg
              ));
              break;

            case 'error':
              console.error('[SSE] 错误:', data.message);
              setMessages((prev) => prev.map(msg =>
                msg.streaming
                  ? { ...msg, streaming: false, content: '发送失败，请重试', ai_error: true }
                  : msg
              ));
              break;
          }
        }
      );

      if (messages.length === 0 && !conversation.title) {
        loadConversation();
      }
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

  // 键盘事件处理
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 删除对话
  const handleDelete = async () => {
    // 显示确认对话框
    setShowDeleteConfirm(true);
  };

  // 确认删除
  const confirmDelete = async () => {
    try {
      await conversationAPI.delete(conversationId);
      setShowDeleteConfirm(false);
      // 触发自定义事件，通知 ConversationList 刷新
      window.dispatchEvent(new CustomEvent('conversation-updated'));
      navigate('/');
    } catch (error) {
      console.error('删除对话失败:', error);
      alert('删除对话失败: ' + (error.message || '未知错误'));
    }
  };

  // 取消删除
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  // 添加标签
  const handleAddTag = async () => {
    if (!newTag.trim()) return;

    const updatedTags = [...tags, newTag.trim()];
    try {
      await conversationAPI.updateTags(conversationId, updatedTags);
      setTags(updatedTags);
      setNewTag('');
      setShowTagInput(false);
    } catch (error) {
      console.error('添加标签失败:', error);
    }
  };

  // 删除标签
  const handleRemoveTag = async (tagToRemove) => {
    const updatedTags = tags.filter((tag) => tag !== tagToRemove);
    try {
      await conversationAPI.updateTags(conversationId, updatedTags);
      setTags(updatedTags);
    } catch (error) {
      console.error('删除标签失败:', error);
    }
  };

  // 选择模型
  const handleSelectModel = async (modelId) => {
    try {
      await conversationAPI.updateModel(conversationId, modelId);
      setSelectedModel(modelId);
      setShowModelDropdown(false);
    } catch (error) {
      console.error('更新模型失败:', error);
      alert('更新模型失败: ' + (error.message || '未知错误'));
    }
  };

  if (loading && messages.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* 顶部标题栏 */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {/* 模型选择下拉框 */}
          <div className="relative">
            <button
              onClick={() => !loadingModels && setShowModelDropdown(!showModelDropdown)}
              disabled={loadingModels}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Bot size={16} className="text-gray-700 dark:text-gray-300" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {loadingModels
                  ? '加载中...'
                  : (models.find(m => m.id === selectedModel)?.name || '选择模型')
                }
              </span>
              <ChevronDown size={14} className="text-gray-500 dark:text-gray-400" />
            </button>

            {/* 下拉菜单 */}
            {showModelDropdown && !loadingModels && (
              <div className="absolute top-full mt-2 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[200px] z-50">
                {models.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                    暂无可用模型
                  </div>
                ) : (
                  models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => handleSelectModel(model.id)}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition ${
                        selectedModel === model.id ? 'bg-gray-100 dark:bg-gray-700' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {model.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {model.provider}
                          </div>
                        </div>
                        {selectedModel === model.id && (
                          <div className="w-2 h-2 bg-gray-900 dark:bg-white rounded-full" />
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 标签和删除按钮 */}
          <div className="flex items-center gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded"
              >
                  <Tag size={10} />
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-500 dark:hover:text-red-400"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
              {showTagInput ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-900 dark:text-white w-20"
                    placeholder="标签"
                    autoFocus
                  />
                  <button
                    onClick={handleAddTag}
                    className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setShowTagInput(false);
                      setNewTag('');
                    }}
                    className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowTagInput(true)}
                  className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition"
                  title="添加标签"
                >
                  <Tag size={16} />
                </button>
              )}
              <button
                onClick={handleDelete}
                className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition"
                title="删除对话"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400"></p>
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
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <Bot size={18} className="text-gray-600 dark:text-gray-300" />
                    </div>
                  )}
                  <div className="max-w-[75%]">
                    {message.sender_type === 'bot' && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          ChatGPT-Fake
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

        {/* 输入框区域 */}
        <div className="flex-shrink-0 px-4 py-4 bg-white dark:bg-gray-900">
          <div className="max-w-4xl mx-auto">
            <ChatInput
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onSubmit={() => handleSendMessage()}
              onKeyDown={handleKeyDown}
              placeholder="给 ChatGPT-Fake 发送消息"
              disabled={sending}
            />
          </div>
        </div>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        show={showDeleteConfirm}
        title="是否删除？"
        message="确定要删除这个对话吗？删除后将无法恢复。"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}
