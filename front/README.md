# ChatGPT-Fake

一个功能完整的类 ChatGPT 聊天应用，支持个人对话、群组对话、多模型选择、流式响应等功能。

## 项目简介

这是为期音科技笔试项目，采用 React + Vite 构建的现代化前端应用。应用实现了类似 ChatGPT 的完整对话体验，包括：

- 🎯 **个人对话**：支持与 AI 进行一对一对话，可选择不同的模型
- 👥 **群组对话**：支持创建群组，多个 AI 成员同时参与对话
- ⚡ **流式响应**：基于 SSE（Server-Sent Events）的实时流式输出
- 🏷️ **标签管理**：为对话添加标签，便于分类管理
- 🌓 **主题切换**：支持明暗主题切换
- 🎨 **极简设计**：黑白简约风格，专注内容体验

## 技术栈

### 核心框架
- **React 19.2**：使用最新的 React 特性
- **Vite 7.2**：极速的构建工具
- **React Router 7**：单页应用路由管理

### UI & 样式
- **Tailwind CSS 3.4**：原子化 CSS 框架
- **Lucide React**：现代化图标库
- **黑白简约设计**：专注内容的视觉风格

### HTTP & 通信
- **Axios**：HTTP 请求库
- **Fetch API + ReadableStream**：原生 SSE 流式传输支持

### 开发工具
- **ESLint 9**：代码规范检查
- **OpenAPI Generator**：API 类型生成（已配置但当前采用手写 API）
- **PostCSS + Autoprefixer**：CSS 后处理

## 项目结构

```
src/
├── components/          # 可复用组件
│   ├── BotSelector.jsx          # 机器人选择器（群组创建）
│   ├── ChatInput.jsx            # 聊天输入框组件
│   ├── ConfirmDialog.jsx        # 确认对话框
│   ├── ConversationList.jsx     # 对话列表侧边栏
│   ├── CreateGroupModal.jsx     # 创建群组模态框
│   ├── Layout.jsx               # 主布局组件
│   └── LoadingSpinner.jsx       # 加载动画
│
├── pages/              # 页面组件
│   ├── WelcomePage.jsx          # 欢迎页（首页）
│   ├── ChatPage.jsx             # 个人对话页
│   ├── GroupChatPage.jsx        # 群组对话页
│   ├── GroupsPage.jsx           # 群组管理页
│   ├── LoginPage.jsx            # 登录页
│   └── ModelTestPage.jsx        # 模型测试页
│
├── services/           # API 服务层
│   ├── api.js                   # 手写的 API 封装（主要使用）
│   └── generatedApi.js          # OpenAPI 生成的 API（备用）
│
├── contexts/           # React Context
│   └── ThemeContext.jsx         # 主题管理上下文
│
├── utils/              # 工具函数
│   ├── auth.js                   # 认证相关工具
│   ├── time.js                   # 时间格式化
│   └── useDeleteConfirm.js      # 删除确认 Hook
│
├── App.jsx              # 根组件
└── main.jsx            # 应用入口
```

## 核心功能与实现逻辑

### 1. SSE 流式传输

**实现位置**：`src/services/api.js`、`src/pages/ChatPage.jsx`

**核心实现**：

```javascript
// services/api.js
sendMessageStream: async (conversationId, content, onChunk) => {
  const response = await fetch(
    `/api/conversations/${conversationId}/messages/stream`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    }
  );

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // 保留不完整的行

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        onChunk(data); // 回调处理每个 SSE 事件
      }
    }
  }
}
```

**SSE 事件处理**：

```javascript
// ChatPage.jsx
conversationAPI.sendMessageStream(conversationId, message, (data) => {
  switch (data.type) {
    case 'aiMessageChunk':
      // 追加内容到正在流式传输的消息
      setMessages((prev) =>
        prev.map(msg =>
          msg.streaming || msg.id === data.data.messageId
            ? { ...msg, content: msg.content + data.data.content }
            : msg
        )
      );
      break;

    case 'aiMessageEnd':
      // 流式传输完成
      setMessages((prev) =>
        prev.map(msg =>
          msg.streaming
            ? { ...msg, streaming: false, content: data.data.content }
            : msg
        )
      );
      break;
  }
});
```

**技术要点**：
- 使用原生 `Fetch API + ReadableStream` 实现 SSE
- 手动解析 SSE 格式（`data: {...}\n`）
- 使用 `TextDecoder` 处理二进制流
- 缓冲区处理不完整的数据行
- 通过回调函数将事件传递给业务层

### 2. 首条消息处理

**问题**：从欢迎页发送首条消息时，需要先创建对话，再发送消息，同时要避免被 `loadMessages()` 异步覆盖。

**解决方案**（`src/pages/ChatPage.jsx`）：

```javascript
// 1. 跳过 loadMessages，避免覆盖首条消息
useEffect(() => {
  loadConversation();
  loadModels();
  hasSentFirstMessage.current = false;

  // 如果有第一条消息，不加载历史消息
  if (!location.state?.firstMessage) {
    loadMessages();
  }
}, [conversationId]);

// 2. 处理首条消息
useEffect(() => {
  if (location.state?.firstMessage && !hasSentFirstMessage.current) {
    hasSentFirstMessage.current = true;

    // 一次性设置用户消息 + AI 占位符
    setMessages([userMessage, {
      id: streamingId,
      sender_type: 'bot',
      content: '',
      streaming: true // 标记为流式传输中
    }]);

    // 调用流式接口
    conversationAPI.sendMessageStream(conversationId, firstMessage, handleSSE);
  }
}, [location.state?.firstMessage, conversationId]);
```

**技术要点**：
- 使用 `useRef` 防止重复发送
- 通过 `location.state` 传递首条消息
- 使用 `setTimeout` 延迟状态更新，避免 React 批处理冲突
- 使用 Map 追踪流式消息 ID，避免状态更新时丢失

### 3. 可复用组件设计

**ChatInput 组件**（`src/components/ChatInput.jsx`）：

将输入框逻辑提取为独立组件，支持：

```javascript
<ChatInput
  value={inputValue}
  onChange={(e) => setInputValue(e.target.value)}
  onSubmit={() => handleSendMessage()}
  onKeyDown={handleKeyDown}
  placeholder="输入消息..."
  disabled={sending}
  hint="Enter 发送，Shift + Enter 换行"
  showHint={true}
  containerClassName=""  // 自定义容器样式
  inputClassName=""      // 自定义输入框样式
/>
```

**核心特性**：
- 自动调整高度的 textarea
- 发送按钮垂直居中对齐
- 支持自定义样式覆盖
- 完整的 TypeScript 类型提示（JSDoc）

### 4. 状态管理与防冲突

**问题**：多个 SSE 事件同时到达时，React 的状态批处理可能导致消息覆盖。

**解决方案**（`src/pages/ChatPage.jsx`）：

```javascript
// 使用 Map 追踪流式消息
const streamingMessageMap = useRef(new Map());

// aiMessageStart 时建立映射
case 'aiMessageStart':
  streamingMessageMap.current.set(data.data.id, true);
  setMessages((prev) => prev.map(msg =>
    msg.id === streamingId
      ? { ...msg, id: data.data.id, streaming: true }
      : msg
  ));
  break;

// aiMessageChunk 时使用多个条件匹配
case 'aiMessageChunk':
  setMessages((prev) => prev.map(msg => {
    const isStreamingMessage = streamingMessageMap.current.has(msg.id);
    const shouldUpdate = msg.id === messageId || isStreamingMessage || msg.streaming;
    if (shouldUpdate) {
      return { ...msg, content: msg.content + content };
    }
    return msg;
  }));
  break;
```

**技术要点**：
- 使用 `useRef` 存储不触发重渲染的数据
- 多个条件组合匹配消息（ID、Map、streaming 标志）
- 保留 `streaming` 属性直到传输完成

### 5. 路由与导航

**路由配置**（`src/App.jsx`）：

```javascript
<Routes>
  <Route path="/" element={<WelcomePage />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/chat/:conversationId" element={<ChatPage />} />
  <Route path="/groups" element={<GroupsPage />} />
  <Route path="/groups/:groupId" element={<GroupChatPage />} />
</Routes>
```

**导航技巧**：

```javascript
// 欢迎页 -> 对话页（携带首条消息）
navigate(`/chat/${conversationId}`, {
  state: { firstMessage: message }
});

// 删除后跳转（检查当前路由）
const currentPath = location.pathname;
if (currentPath === `/chat/${id}`) {
  navigate('/'); // 正在被删除，跳回首页
}
```

### 6. API 封装与拦截器

**请求拦截器**（`src/services/api.js`）：

```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**响应拦截器**：

```javascript
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

**模块化 API**：

```javascript
export const conversationAPI = {
  create: (data) => api.post('/conversations', data),
  getAll: (params) => api.get('/conversations', { params }),
  getById: (conversationId) => api.get(`/conversations/${conversationId}`),
  sendMessage: (conversationId, content) =>
    api.post(`/conversations/${conversationId}/messages`, { content }),
  sendMessageStream: async (conversationId, content, onChunk) => {
    // SSE 实现
  },
};
```

## 开发指南

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:5173`

### 构建生产版本

```bash
npm run build
```

### 代码规范检查

```bash
npm run lint
```

### 生成 OpenAPI 客户端（可选）

```bash
npm run apis
```

> 注意：当前项目使用手写 API（`src/services/api.js`），OpenAPI 生成的代码位于 `src/api-generated/`，暂未使用。

## 环境变量

创建 `.env` 文件：

```env
VITE_API_BASE_URL=/api
```

## 设计亮点

### 1. 黑白简约风格

- 主色调：纯黑/纯白，灰度过渡
- 强调内容，弱化装饰
- 圆角设计，现代感强

### 2. 流畅的交互体验

- 打字机效果的流式输出
- 光标闪烁动画（`animate-pulse`）
- 自动滚动到底部
- 加载状态反馈

### 3. 组件复用

- `ChatInput` 组件在多个页面复用
- `ConfirmDialog` 统一的确认交互
- `LoadingSpinner` 统一的加载动画

### 4. 状态管理策略

- 使用 React Hooks（useState, useEffect, useRef）
- 使用 Context API 管理全局主题
- 使用 Custom Hook 封装逻辑（useDeleteConfirm）