import { useState } from 'react';
import BotSelector from './BotSelector';

/**
 * 创建群组模态框组件
 * @param {Object} props
 * @param {boolean} props.show - 是否显示模态框
 * @param {Function} props.onClose - 关闭模态框的函数
 * @param {Function} props.onCreate - 创建群组的函数
 * @param {Array} props.bots - 机器人列表
 */
export default function CreateGroupModal({ show, onClose, onCreate, bots }) {
  const [groupName, setGroupName] = useState('');
  const [selectedBots, setSelectedBots] = useState([]);

  const handleCreate = () => {
    if (!groupName.trim() || selectedBots.length === 0) {
      alert('请输入群组名称并选择至少一个机器人');
      return;
    }

    onCreate({
      name: groupName.trim(),
      botIds: selectedBots,
    });

    // 重置表单
    setGroupName('');
    setSelectedBots([]);
  };

  const toggleBot = (botId) => {
    setSelectedBots((prev) =>
      prev.includes(botId)
        ? prev.filter((id) => id !== botId)
        : [...prev, botId]
    );
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">创建新群组</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              群组名称
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
              placeholder="例如：技术讨论组"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              选择机器人（至少一个）
            </label>
            <BotSelector
              bots={bots}
              selectedBots={selectedBots}
              onToggleBot={toggleBot}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition"
            >
              取消
            </button>
            <button
              onClick={handleCreate}
              disabled={!groupName.trim() || selectedBots.length === 0}
              className="flex-1 px-4 py-2 bg-gray-900 dark:bg-white hover:opacity-80 disabled:opacity-30 disabled:hover:opacity-30 text-white dark:text-gray-900 rounded-lg text-sm transition"
            >
              创建
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
