import { useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

/**
 * 聊天输入框组件
 * @param {Object} props
 * @param {string} props.value - 输入框的值
 * @param {Function} props.onChange - 值变化回调
 * @param {Function} props.onSubmit - 提交回调
 * @param {Function} props.onKeyDown - 键盘事件回调（可选）
 * @param {string} props.placeholder - 占位符文本
 * @param {boolean} props.disabled - 是否禁用
 * @param {string} props.hint - 提示文本（可选）
 * @param {boolean} props.showHint - 是否显示提示文本
 * @param {string} props.containerClassName - 容器的额外样式类
 * @param {string} props.inputClassName - 输入框的额外样式类
 */
export default function ChatInput({
  value,
  onChange,
  onSubmit,
  onKeyDown,
  placeholder = '输入消息...',
  disabled = false,
  hint = 'Enter 发送，Shift + Enter 换行',
  showHint = true,
  containerClassName = '',
  inputClassName = '',
}) {
  const textareaRef = useRef(null);

  // 自动调整文本框高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  const handleKeyDown = (e) => {
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  return (
    <div className="w-full">
      <div className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-300 dark:border-gray-600 ${containerClassName}`}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={`w-full px-4 py-3 pr-14 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:outline-none rounded-xl max-h-48 overflow-y-auto ${inputClassName}`}
          style={{ minHeight: '48px' }}
        />

        {/* 发送按钮 */}
        <button
          onClick={onSubmit}
          disabled={!value.trim() || disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black dark:bg-white text-white dark:text-black rounded-md hover:opacity-80 disabled:opacity-20 disabled:hover:opacity-20 transition-opacity"
          title="发送"
        >
          <Send size={16} />
        </button>
      </div>
      {showHint && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
          {hint}
        </p>
      )}
    </div>
  );
}
