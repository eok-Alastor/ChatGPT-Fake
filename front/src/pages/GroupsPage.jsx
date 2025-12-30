import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupConversationAPI } from '../services/api';
import { Plus, Users, Clock, Bot, MessageSquare } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatTime } from '../utils/time';
import CreateGroupModal from '../components/CreateGroupModal';

export default function GroupsPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [bots, setBots] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    groupId: null,
    groupName: '',
  });

  // 加载群组列表
  const loadGroups = useCallback(async () => {
    try {
      setLoading(true);
      const response = await groupConversationAPI.getAll();
      setGroups(response.data);
    } catch (error) {
      console.error('加载群组列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 加载机器人列表
  const loadBots = async () => {
    if (bots.length > 0) return; // 已加载则跳过

    try {
      const response = await groupConversationAPI.getBots();
      setBots(response.data);
    } catch (error) {
      console.error('加载机器人列表失败:', error);
      alert('加载机器人列表失败');
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  // 当页面重新获得焦点时刷新列表
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadGroups();
      }
    };

    const handleFocus = () => {
      loadGroups();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadGroups]);

  // 监听 conversation-updated 事件，从 menu 组件创建群组后刷新
  useEffect(() => {
    const handleConversationUpdated = () => {
      console.log('GroupsPage 收到 conversation-updated 事件，刷新列表');
      loadGroups();
    };

    window.addEventListener('conversation-updated', handleConversationUpdated);
    return () => {
      window.removeEventListener('conversation-updated', handleConversationUpdated);
    };
  }, [loadGroups]);

  // 打开创建群组弹窗
  const handleOpenCreateModal = async () => {
    await loadBots();
    setShowCreateModal(true);
  };

  // 创建群组回调
  const handleCreateGroup = async (data) => {
    try {
      await groupConversationAPI.create(data);
      setShowCreateModal(false);
      await loadGroups();
    } catch (error) {
      console.error('创建群组失败:', error);
      alert('创建群组失败: ' + (error.message || '未知错误'));
    }
  };

  // 删除群组
  const handleDelete = (groupId, groupName, e) => {
    e.stopPropagation();
    setDeleteConfirm({
      show: true,
      groupId,
      groupName,
    });
  };

  // 确认删除
  const confirmDelete = async () => {
    try {
      await groupConversationAPI.delete(deleteConfirm.groupId);
      setDeleteConfirm({ show: false, groupId: null, groupName: '' });
      await loadGroups();
    } catch (error) {
      console.error('删除群组失败:', error);
      alert('删除群组失败: ' + (error.message || '未知错误'));
    }
  };

  // 取消删除
  const cancelDelete = () => {
    setDeleteConfirm({ show: false, groupId: null, groupName: '' });
  };

  return (
    <div className="h-full flex flex-col">
      {/* 顶部操作栏 */}
      <div className="flex-shrink-0 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">群组对话</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {groups.length} 个群组
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-white hover:opacity-80 text-white dark:text-gray-900 rounded-lg transition font-medium"
          >
            <Plus size={18} />
            创建群组
          </button>
        </div>
      </div>

      {/* 群组列表 */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <LoadingSpinner />
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <Users className="text-gray-400 dark:text-gray-600" size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              还没有群组
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              创建一个群组，与多个机器人开始对话
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white hover:opacity-80 text-white dark:text-gray-900 rounded-lg transition font-medium"
            >
              <Plus size={18} />
              创建第一个群组
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {groups.map((group) => (
              <div
                key={group.id}
                onClick={() => navigate(`/groups/${group.id}`)}
                className="group bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-xl p-5 cursor-pointer transition-all hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 relative"
              >
                {/* 顶部信息 */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Users className="text-white" size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {group.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {group.botIds?.length || 0} 个机器人
                        </span>
                        {group.lastMessage && (
                          <>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              {formatTime(group.lastMessage.created_at)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(group.id, group.name, e)}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition opacity-0 group-hover:opacity-100"
                    title="删除群组"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                {/* 机器人列表 */}
                {group.bots && group.bots.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="flex -space-x-2">
                      {group.bots.slice(0, 4).map((bot, index) => (
                        <div
                          key={bot.id || index}
                          className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center"
                          title={bot.name}
                        >
                          <Bot size={12} className="text-gray-600 dark:text-gray-400" />
                        </div>
                      ))}
                      {group.bots.length > 4 && (
                        <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                            +{group.bots.length - 4}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 最后消息 */}
                {group.lastMessage ? (
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {group.lastMessage.senderType === 'bot' ? (
                        <Bot size={12} className="text-purple-600 dark:text-purple-500" />
                      ) : (
                        <MessageSquare size={12} className="text-gray-400 dark:text-gray-500" />
                      )}
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {group.lastMessage.senderName || '用户'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {group.lastMessage.content}
                    </p>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                      暂无消息，开始对话吧
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 创建群组弹窗 */}
      <CreateGroupModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateGroup}
        bots={bots}
      />

      {/* 删除确认对话框 */}
      <ConfirmDialog
        show={deleteConfirm.show}
        title="是否删除？"
        message={`确定要删除群组"${deleteConfirm.groupName}"吗？删除后将无法恢复。`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}
