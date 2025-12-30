import { useEffect, useState } from 'react';
import { modelAPI, conversationAPI } from '../services/api';

/**
 * 临时测试页面 - 用于调试模型 API
 * 访问: /test-models
 */
export default function ModelTestPage() {
  const [logs, setLogs] = useState([]);
  const [testConversationId, setTestConversationId] = useState('');

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
    console.log(`[${type.toUpperCase()}]`, message);
  };

  // 测试 1: 获取模型列表
  const testGetModels = async () => {
    addLog('开始测试: GET /api/models', 'info');
    try {
      const response = await modelAPI.getAll();
      addLog(`✅ 成功获取模型列表: ${JSON.stringify(response)}`, 'success');
      return response;
    } catch (error) {
      addLog(`❌ 失败: ${error.message}`, 'error');
      addLog(`状态码: ${error.status}`, 'error');
      return null;
    }
  };

  // 测试 2: 获取对话的模型设置
  const testGetConversationModel = async () => {
    if (!testConversationId) {
      addLog('⚠️ 请输入 conversationId', 'warning');
      return;
    }

    addLog(`开始测试: GET /api/conversations/${testConversationId}/model`, 'info');
    try {
      const response = await conversationAPI.getModel(testConversationId);
      addLog(`✅ 成功获取对话模型: ${JSON.stringify(response)}`, 'success');
      return response;
    } catch (error) {
      addLog(`❌ 失败: ${error.message}`, 'error');
      addLog(`状态码: ${error.status}`, 'error');
      return null;
    }
  };

  // 测试 3: 更新对话的模型设置
  const testUpdateConversationModel = async () => {
    if (!testConversationId) {
      addLog('⚠️ 请输入 conversationId', 'warning');
      return;
    }

    addLog(`开始测试: PUT /api/conversations/${testConversationId}/model`, 'info');
    try {
      const response = await conversationAPI.updateModel(testConversationId, 'gpt-4');
      addLog(`✅ 成功更新对话模型: ${JSON.stringify(response)}`, 'success');
      return response;
    } catch (error) {
      addLog(`❌ 失败: ${error.message}`, 'error');
      addLog(`状态码: ${error.status}`, 'error');
      return null;
    }
  };

  // 清除日志
  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          模型 API 测试页面
        </h1>

        {/* 测试控制区 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            测试控制
          </h2>

          <div className="space-y-4">
            {/* 输入 conversationId */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Conversation ID (用于测试对话相关 API)
              </label>
              <input
                type="text"
                value={testConversationId}
                onChange={(e) => setTestConversationId(e.target.value)}
                placeholder="粘贴对话 ID"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* 测试按钮 */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={testGetModels}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                测试获取模型列表
              </button>
              <button
                onClick={testGetConversationModel}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
              >
                测试获取对话模型
              </button>
              <button
                onClick={testUpdateConversationModel}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
              >
                测试更新对话模型
              </button>
              <button
                onClick={clearLogs}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
              >
                清除日志
              </button>
            </div>
          </div>
        </div>

        {/* 日志显示区 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            测试日志
          </h2>

          <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-500">暂无日志</p>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`mb-2 ${
                    log.type === 'error'
                      ? 'text-red-400'
                      : log.type === 'success'
                      ? 'text-green-400'
                      : log.type === 'warning'
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}
                >
                  <span className="text-gray-500">[{log.timestamp}]</span>{' '}
                  {log.message}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 说明文档 */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2 text-blue-900 dark:text-blue-300">
            后端检查清单
          </h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li>
              确认后端已注册 <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">/api/models</code>{' '}
              路由
            </li>
            <li>
              检查路由文件 <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">src/routes/models.ts</code>{' '}
              是否存在
            </li>
            <li>
              确认路由已注册到 Express app:{' '}
              <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">app.use('/api/models', modelsRouter)</code>
            </li>
            <li>
              检查服务器控制台是否有错误信息
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
