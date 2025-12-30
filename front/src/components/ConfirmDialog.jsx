import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

/**
 * 自定义确认对话框组件
 * @param {Object} props
 * @param {boolean} props.show - 是否显示对话框
 * @param {string} props.title - 对话框标题
 * @param {string} props.message - 对话框消息
 * @param {Function} props.onConfirm - 确认回调
 * @param {Function} props.onCancel - 取消回调
 */
export default function ConfirmDialog({ show, title = '确认操作', message, onConfirm, onCancel }) {
  if (!show) return null;

  const handleConfirm = () => {
    onConfirm?.();
  };

  const handleCancel = () => {
    onCancel?.();
  };

  // 处理键盘事件
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-red-600 dark:text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>

        {/* 消息内容 */}
        <div className="px-6 py-4">
          <p className="text-gray-700 dark:text-gray-300">
            {message}
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-xl">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition font-medium"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
          >
            确认删除
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
