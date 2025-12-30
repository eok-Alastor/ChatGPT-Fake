import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { conversationAPI, groupConversationAPI, tagAPI } from '../services/api';
import { Plus, Tag, MessageSquare, Users, X, Trash2, Edit2, ChevronDown, ChevronUp, Bot, MoreHorizontal } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';
import CreateGroupModal from './CreateGroupModal';

export default function ConversationList({ activeTab }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

  // 删除确认对话框状态
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    type: null, // 'conversation' | 'group'
    id: null,
  });

  // 创建群组模态框相关状态
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [bots, setBots] = useState([]);

  // 加载数据
  const loadData = async (tab, tag = null, forceRefresh = false) => {
    try {
      setLoading(true);
      if (tab === 'conversations') {
        const params = tag ? { tag } : {};
        // 添加时间戳参数避免缓存
        if (forceRefresh) {
          params._t = Date.now();
        }
        const response = await conversationAPI.getAll(params);
        setConversations(response.data);
      } else {
        const response = await groupConversationAPI.getAll();
        setGroups(response.data);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleMenuButtonClick = (e, itemId) => {
    e.stopPropagation();
    if (openMenuId === itemId) {
      setOpenMenuId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      // 使用 left 定位，让菜单左边从按钮右边开始
      const position = {
        top: rect.bottom + 4,
        left: rect.right
      };
      console.log('Button right edge:', rect.right, 'Menu left position:', position.left);
      setMenuPosition(position);
      setOpenMenuId(itemId);
    }
  };

  // 加载标签
  const loadTags = async () => {
    try {
      const response = await tagAPI.getAll();
      setTags(response.data);
    } catch (error) {
      console.error('加载标签失败:', error);
    }
  };

  useEffect(() => {
    loadData(activeTab);
    if (activeTab === 'conversations') {
      loadTags();
    }
  }, [activeTab]);

  // 监听路由变化，刷新数据（当创建新对话后）
  useEffect(() => {
    // 当路由包含 /chat/ 时，说明用户进入了对话页面，需要刷新列表
    if (location.pathname.startsWith('/chat/') && activeTab === 'conversations') {
      loadData('conversations', selectedTag);
    }
    // 当路由包含 /groups/ 时，说明用户进入了群组对话页面
    if (location.pathname.startsWith('/groups/') && activeTab === 'groups') {
      loadData('groups');
    }
  }, [location.pathname]);

  // 监听对话更新事件（编辑标题、删除、创建等）
  useEffect(() => {
    const handleConversationUpdated = () => {
      console.log('收到 conversation-updated 事件，刷新列表');
      loadData(activeTab, selectedTag, true); // 强制刷新
    };

    window.addEventListener('conversation-updated', handleConversationUpdated);
    return () => {
      window.removeEventListener('conversation-updated', handleConversationUpdated);
    };
  }, [activeTab, selectedTag]);

  // 筛选标签
  const handleFilterByTag = async (tag) => {
    if (selectedTag === tag) {
      setSelectedTag(null);
      await loadData(activeTab, null);
    } else {
      setSelectedTag(tag);
      await loadData(activeTab, tag);
    }
  };

  // 创建新对话/群组
  const handleCreate = async () => {
    if (activeTab === 'conversations') {
      // 导航到首页，让用户输入第一条消息后再创建对话
      navigate('/');
    } else {
      // 打开创建群组模态框
      await loadBots();
      setShowCreateGroupModal(true);
    }
  };

  // 加载机器人列表
  const loadBots = async () => {
    try {
      const response = await groupConversationAPI.getBots();
      setBots(response.data);
    } catch (error) {
      console.error('加载机器人列表失败:', error);
    }
  };

  // 创建群组回调
  const handleCreateGroup = async (data) => {
    try {
      await groupConversationAPI.create(data);
      setShowCreateGroupModal(false);
      // 强制刷新，避免缓存
      await loadData('groups', null, true);
      // 触发事件通知其他页面
      window.dispatchEvent(new CustomEvent('conversation-updated'));
    } catch (error) {
      console.error('创建群组失败:', error);
      alert('创建群组失败: ' + (error.message || '未知错误'));
      throw error;
    }
  };

  // 删除对话
  const handleDeleteConversation = (conversationId, e) => {
    e.stopPropagation();
    // 显示确认对话框
    setDeleteConfirm({ show: true, type: 'conversation', id: conversationId });
  };

  // 删除群组
  const handleDeleteGroup = (groupId, e) => {
    e.stopPropagation();
    // 显示确认对话框
    setDeleteConfirm({ show: true, type: 'group', id: groupId });
  };

  // 确认删除
  const confirmDelete = async () => {
    const { type, id } = deleteConfirm;

    try {
      if (type === 'conversation') {
        await conversationAPI.delete(id);

        // 检查是否正在查看被删除的对话
        const currentPath = location.pathname;
        if (currentPath === `/chat/${id}`) {
          // 正在查看被删除的对话，跳回首页
          navigate('/');
        }
      } else if (type === 'group') {
        await groupConversationAPI.delete(id);

        // 检查是否正在查看被删除的群组
        const currentPath = location.pathname;
        if (currentPath === `/groups/${id}`) {
          // 正在查看被删除的群组，跳回群组列表页
          navigate('/groups');
        }
      }

      // 强制刷新，避免缓存
      await loadData(activeTab, selectedTag, true);
      // 触发事件通知其他页面
      window.dispatchEvent(new CustomEvent('conversation-updated'));
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败: ' + (error.message || '未知错误'));
    } finally {
      setDeleteConfirm({ show: false, type: null, id: null });
    }
  };

  // 取消删除
  const cancelDelete = () => {
    setDeleteConfirm({ show: false, type: null, id: null });
  };

  // 开始编辑标题
  const startEdit = (conversation, e) => {
    e.stopPropagation();
    setEditingId(conversation.id);
    setNewTitle(conversation.title);
  };

  // 保存标题
  const saveTitle = async (conversationId, e) => {
    e.stopPropagation();
    try {
      await conversationAPI.updateTitle(conversationId, newTitle);
      setEditingId(null);
      // 强制刷新，避免缓存
      await loadData(activeTab, selectedTag, true);
      // 触发事件通知其他页面
      window.dispatchEvent(new CustomEvent('conversation-updated'));
    } catch (error) {
      console.error('更新标题失败:', error);
      alert('更新标题失败: ' + (error.message || '未知错误'));
    }
  };

  // 取消编辑
  const cancelEdit = (e) => {
    e.stopPropagation();
    setEditingId(null);
    setNewTitle('');
  };

  // 格式化时间
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;

    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  };

  const currentItems = activeTab === 'conversations' ? conversations : groups;

  return (
    <div className="h-full flex flex-col">
      {/* 创建按钮 */}
      <div className="py-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={handleCreate}
          className="w-full flex items-center justify-center gap-2 mb-2 px-4 py-2.5 bg-black dark:bg-white text-white dark:text-black hover:opacity-80 rounded-lg transition"
        >
          <Plus size={18} />
          <span className="text-sm font-medium">
            {activeTab === 'conversations' ? '新建对话' : '创建群组'}
          </span>
        </button>
      </div>

      {/* 折叠/展开按钮 */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 px-3 py-2 mt-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
      >
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {collapsed ? '展开对话记录' : '折叠对话记录'}
        </span>
        {collapsed ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronUp size={14} className="text-gray-500" />}
      </button>

      {/* 标签筛选（仅个人对话显示且未折叠时） */}
      {!collapsed && activeTab === 'conversations' && tags.length > 0 && (
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => handleFilterByTag(null)}
              className={`px-2.5 py-1 rounded-md text-xs transition ${
                selectedTag === null
                  ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              全部
            </button>
            {tags.map((tag) => (
              <button
                key={tag.name}
                onClick={() => handleFilterByTag(tag.name)}
                className={`px-2 py-1 rounded-md text-xs transition flex items-center gap-1 ${
                  selectedTag === tag.name
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 对话/群组列表 */}
      <div className="flex-1 overflow-y-auto">
        {collapsed ? (
          // 折叠状态显示提示
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {activeTab === 'conversations' ? '对话记录已折叠' : '群组列表已折叠'}
            </p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="text-center py-12 px-3">
            {activeTab === 'conversations' ? (
              <MessageSquare className="mx-auto text-gray-400 dark:text-gray-600 mb-2" size={32} />
            ) : (
              <Users className="mx-auto text-gray-400 dark:text-gray-600 mb-2" size={32} />
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {selectedTag
                ? `没有标签为 "${selectedTag}" 的对话`
                : activeTab === 'conversations'
                ? '还没有对话'
                : '还没有群组'}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            {currentItems.map((item) => (
              <div
                key={item.id}
                onClick={() =>
                  navigate(
                    activeTab === 'conversations'
                      ? `/chat/${item.id}`
                      : `/groups/${item.id}`
                  )
                }
                className="group relative px-3 py-2 rounded-md cursor-pointer transition hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {editingId === item.id ? (
                  // 编辑模式
                  <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-400"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          saveTitle(item.id, e);
                        } else if (e.key === 'Escape') {
                          cancelEdit(e);
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => saveTitle(item.id, e)}
                        className="px-3 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded text-xs hover:opacity-80 transition"
                      >
                        保存
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-300 dark:hover:bg-gray-700 transition"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  // 正常显示模式
                  <div className="flex items-center gap-3">
                    {activeTab === 'groups' ? (
                      <div className="flex-shrink-0 w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Users className="text-gray-600 dark:text-gray-400" size={16} />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <MessageSquare className="text-gray-600 dark:text-gray-400" size={16} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {item.title || item.name}
                      </h3>
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {item.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {item.lastMessage && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                          {item.lastMessage.content}
                        </p>
                      )}
                    </div>
                    <div className="relative">
                      <button
                        onClick={(e) => handleMenuButtonClick(e, item.id)}
                        className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition"
                        title="更多选项"
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {/* 下拉菜单 - 使用 Portal 渲染到 body */}
                      {openMenuId === item.id &&
                        createPortal(
                          <div
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 min-w-[120px]"
                            style={{
                              position: 'fixed',
                              top: `${menuPosition.top}px`,
                              left: `${menuPosition.left}px`,
                              zIndex: 9999,
                            }}
                          >
                            {activeTab === 'conversations' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(null);
                                  startEdit(item, e);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 rounded-lg transition mx-1"
                              >
                                <Edit2 size={14} />
                                <span>编辑标题</span>
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(null);
                                activeTab === 'conversations'
                                  ? handleDeleteConversation(item.id, e)
                                  : handleDeleteGroup(item.id, e);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 rounded-lg transition mx-1"
                            >
                              <Trash2 size={14} />
                              <span>删除</span>
                            </button>
                          </div>,
                          document.body
                        )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 点击外部关闭菜单 */}
      {openMenuId && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setOpenMenuId(null)}
        />
      )}

      {/* 创建群组模态框 */}
      <CreateGroupModal
        show={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onCreate={handleCreateGroup}
        bots={bots}
      />

      {/* 删除确认对话框 */}
      <ConfirmDialog
        show={deleteConfirm.show}
        title="是否删除？"
        message={
          deleteConfirm.type === 'conversation'
            ? '确定要删除这个对话吗？删除后将无法恢复。'
            : '确定要删除这个群组吗？删除后将无法恢复。'
        }
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}
