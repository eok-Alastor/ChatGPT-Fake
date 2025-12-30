import { useState } from 'react';

/**
 * 删除确认 Hook
 * @param {Function} deleteFn - 执行删除的函数
 * @param {string} message - 确认消息
 * @returns {Object} { handleDelete, deleting }
 */
export function useDeleteConfirm(deleteFn, message = '确定要删除吗？') {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (...args) => {
    if (!window.confirm(message)) return;

    setDeleting(true);
    try {
      await deleteFn(...args);
    } finally {
      setDeleting(false);
    }
  };

  return { handleDelete, deleting };
}
