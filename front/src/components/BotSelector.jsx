import { Bot } from 'lucide-react';

/**
 * Bot 选择器组件 - 黑白简约风格
 * @param {Object} props
 * @param {Array} props.bots - 机器人列表
 * @param {Array} props.selectedBots - 已选中的机器人ID列表
 * @param {Function} props.onToggleBot - 切换选中状态的函数
 */
export default function BotSelector({ bots, selectedBots, onToggleBot }) {
  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {bots.map((bot) => {
        const isSelected = selectedBots.includes(bot.id);
        return (
          <div
            key={bot.id}
            onClick={() => onToggleBot(bot.id)}
            className={`p-3 rounded-lg border-2 cursor-pointer transition ${
              isSelected
                ? 'bg-gray-900 dark:bg-white border-gray-900 dark:border-white'
                : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isSelected
                    ? 'bg-white dark:bg-gray-900'
                    : 'bg-gray-400 dark:bg-gray-600'
                }`}
              >
                <Bot
                  size={18}
                  className={isSelected ? 'text-gray-900 dark:text-white' : 'text-white'}
                />
              </div>
              <div className="flex-1">
                <div
                  className={`font-medium text-sm ${
                    isSelected
                      ? 'text-white dark:text-gray-900'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {bot.name}
                </div>
                <div
                  className={`text-xs ${
                    isSelected
                      ? 'text-gray-300 dark:text-gray-700'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {bot.personality}
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  isSelected
                    ? 'bg-white dark:bg-gray-900 border-white dark:border-gray-900'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                {isSelected && (
                  <div className="w-3 h-3 bg-gray-900 dark:bg-white rounded-sm" />
                )}
              </div>
            </div>
            {bot.description && (
              <p
                className={`text-xs mt-2 ${
                  isSelected
                    ? 'text-gray-300 dark:text-gray-700'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {bot.description}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
