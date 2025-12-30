# ChatGPT Fake Backend

一个简化版的在线聊天应用后端服务，类似 ChatGPT 的基本交互体验。

## 功能特性

- 用户认证与授权 (JWT)
- 个人对话管理 (创建、查看、修改、删除、标签)
- 消息交互 (含 AI 模拟回复和重试机制)
- **模型切换** - 支持多种 AI 模型选择 (GPT-4, Claude 3 等)
- **流式响应** - SSE 实时流式 AI 回复
- 群组对话功能 (多机器人参与)
- 完整的权限控制 (用户只能访问自己的数据)

## 技术栈

- **语言**: TypeScript
- **框架**: Express.js
- **数据库**: SQLite (better-sqlite3)
- **认证**: JWT (jsonwebtoken)
- **密码加密**: bcryptjs

## 项目结构

```
chatgpt-fake-backend/
├── src/
│   ├── db/
│   │   └── schema.ts          # 数据库 schema 和初始化
│   ├── middleware/
│   │   ├── auth.ts            # JWT 认证中间件
│   │   └── errorHandler.ts    # 错误处理中间件
│   ├── routes/
│   │   ├── auth.ts            # 认证路由
│   │   ├── conversations.ts   # 对话管理路由
│   │   ├── messages.ts        # 消息路由 (含 SSE 流式)
│   │   ├── bots.ts            # 机器人路由
│   │   ├── models.ts          # AI 模型路由
│   │   ├── groups.ts          # 群组对话路由 (含 SSE 流式)
│   │   └── tags.ts            # 标签路由
│   ├── services/
│   │   ├── authService.ts     # 认证服务
│   │   ├── conversationService.ts  # 对话服务
│   │   ├── messageService.ts  # 消息服务
│   │   ├── modelService.ts    # 模型服务
│   │   ├── botService.ts      # 机器人服务
│   │   ├── groupService.ts    # 群组服务
│   │   └── aiService.ts       # AI 模拟服务 (含流式)
│   ├── types/
│   │   └── index.ts           # TypeScript 类型定义
│   └── index.ts               # 应用入口
├── .env                       # 环境变量
├── .env.example               # 环境变量示例
├── tsconfig.json              # TypeScript 配置
├── package.json               # 项目依赖
└── README.md                  # 项目文档
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

`.env` 文件内容：

```env
PORT=3000
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
NODE_ENV=development
DATABASE_PATH=./database.sqlite
```

### 开发模式

```bash
npm run dev
```

### 生产构建

```bash
npm run build
npm start
```

## API 文档

Base URL: `http://localhost:3000/api`

### 认证模块 (Auth)

#### 注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "123456"
}
```

#### 登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "123456"
}
```

#### 获取当前用户
```http
GET /api/auth/me
Authorization: Bearer {token}
```

### AI 模型模块 (Models)

#### 获取所有可用模型
```http
GET /api/models
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "gpt-4",
      "name": "GPT-4",
      "provider": "OpenAI",
      "context_limit": 8192,
      "pricing_per_1k_tokens": "0.03",
      "is_active": 1
    },
    {
      "id": "gpt-4-turbo",
      "name": "GPT-4 Turbo",
      "provider": "OpenAI",
      "context_limit": 128000,
      "pricing_per_1k_tokens": "0.01",
      "is_active": 1
    },
    {
      "id": "gpt-3.5-turbo",
      "name": "GPT-3.5 Turbo",
      "provider": "OpenAI",
      "context_limit": 16385,
      "pricing_per_1k_tokens": "0.002",
      "is_active": 1
    },
    {
      "id": "claude-3-opus",
      "name": "Claude 3 Opus",
      "provider": "Anthropic",
      "context_limit": 200000,
      "pricing_per_1k_tokens": "0.015",
      "is_active": 1
    },
    {
      "id": "claude-3-sonnet",
      "name": "Claude 3 Sonnet",
      "provider": "Anthropic",
      "context_limit": 200000,
      "pricing_per_1k_tokens": "0.003",
      "is_active": 1
    }
  ]
}
```

**接口逻辑说明**:
- 返回所有激活状态 (`is_active = 1`) 的 AI 模型
- 模型按提供商和 ID 排序
- 每个模型包含上下文限制和定价信息

### 个人对话模块 (Conversations)

#### 获取对话列表
```http
GET /api/conversations?tag=可选&page=1&limit=20
Authorization: Bearer {token}
```

#### 创建对话
```http
POST /api/conversations
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "我的新对话",
  "modelId": "gpt-4-turbo"
}
```

**接口逻辑说明**:
- `modelId` 为可选参数，默认使用 `gpt-3.5-turbo`
- 创建时会验证模型是否存在于可用模型列表中
- 模型 ID 会保存在对话的 `model_id` 字段中
- 后续该对话的所有消息都会使用此模型

#### 获取对话详情
```http
GET /api/conversations/{conversationId}
Authorization: Bearer {token}
```

#### 更新对话标题
```http
PATCH /api/conversations/{conversationId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "新标题"
}
```

#### 更新对话标签
```http
PATCH /api/conversations/{conversationId}/tags
Authorization: Bearer {token}
Content-Type: application/json

{
  "tags": ["工作", "学习"]
}
```

#### 删除对话
```http
DELETE /api/conversations/{conversationId}
Authorization: Bearer {token}
```

#### 获取对话当前模型
```http
GET /api/conversations/{conversationId}/model
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "modelId": "gpt-4-turbo"
  }
}
```

**接口逻辑说明**:
- 返回该对话当前使用的 AI 模型 ID
- 验证用户是否为对话所有者
- 未设置模型时返回默认值 `gpt-3.5-turbo`

#### 更新对话模型
```http
PUT /api/conversations/{conversationId}/model
Authorization: Bearer {token}
Content-Type: application/json

{
  "modelId": "claude-3-opus"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "modelId": "claude-3-opus"
  }
}
```

**接口逻辑说明**:
- 验证模型 ID 是否存在于可用模型列表中
- 更新后，该对话的所有后续消息都会使用新模型
- 仅对话所有者可以修改模型设置
- 返回更新后的模型 ID 确认

### 消息模块 (Messages)

#### 流式发送消息 (SSE)
```http
POST /api/conversations/{conversationId}/messages/stream
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "你好，AI！"
}
```

**SSE 事件格式**:

1. **用户消息事件** (`userMessage`)
```
event: message
data: {"type":"userMessage","data":{"id":"msg-123","sender_type":"user","content":"你好","created_at":"2025-12-30T..."}}
```

2. **AI 消息开始** (`aiMessageStart`)
```
event: message
data: {"type":"aiMessageStart","data":{"id":"ai-msg-456","sender_type":"bot","created_at":"2025-12-30T..."}}
```

3. **AI 消息内容块** (`aiMessageChunk`) - 逐字符流式输出
```
event: message
data: {"type":"aiMessageChunk","data":{"messageId":"ai-msg-456","content":"[gpt-4-turbo] 你"}}
event: message
data: {"type":"aiMessageChunk","data":{"messageId":"ai-msg-456","content":"好"}}
```

4. **AI 消息结束** (`aiMessageEnd`)
```
event: message
data: {"type":"aiMessageEnd","data":{"messageId":"ai-msg-456","content":"[gpt-4-turbo] 你好"}}
```

5. **完成事件** (`done`)
```
event: done
data: {"success":true}
```

6. **错误事件** (`error`)
```
event: error
data: {"type":"error","message":"AI 服务暂时不可用"}
```

**接口逻辑说明**:
- 使用 SSE (Server-Sent Events) 实现流式响应
- 用户消息立即保存并发送事件
- AI 响应按字符逐个流式输出，模拟打字效果 (每字符 10-50ms 延迟)
- AI 响应使用对话当前设置的模型 (`model_id`)
- 完整的 AI 消息在流式传输结束后保存到数据库
- 错误发生时发送错误事件并保存错误标记到数据库

**前端集成示例** (Fetch + ReadableStream):

```javascript
async function sendMessageStream(conversationId, content, token) {
  const response = await fetch(
    `http://localhost:3000/api/conversations/${conversationId}/messages/stream`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
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
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('event: message')) {
        const dataLine = lines[lines.indexOf(line) + 1];
        if (dataLine?.startsWith('data: ')) {
          const data = JSON.parse(dataLine.slice(6));
          handleMessage(data);
        }
      }
    }
  }
}

function handleMessage(event) {
  switch (event.type) {
    case 'userMessage':
      console.log('用户:', event.data.content);
      break;
    case 'aiMessageStart':
      console.log('AI 开始回复...');
      break;
    case 'aiMessageChunk':
      // 逐字符追加到显示区域
      appendToDisplay(event.data.content);
      break;
    case 'aiMessageEnd':
      console.log('AI 完整回复:', event.data.content);
      break;
  }
}
```

#### 获取对话消息列表
```http
GET /api/conversations/{conversationId}/messages?page=1&limit=50
Authorization: Bearer {token}
```

#### 发送消息
```http
POST /api/conversations/{conversationId}/messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "你好，AI！"
}
```

**AI 调用健壮性**：
- 用户消息始终保存
- AI 调用失败时自动重试（最多 2 次）
- 超时时间：30 秒
- 失败后返回 202 状态码，包含错误信息

### 机器人模块 (Bots)

#### 获取所有可用机器人
```http
GET /api/bots
Authorization: Bearer {token}
```

预设机器人：
- `bot-cs`: 客服机器人 - 友善、耐心
- `bot-tech`: 技术机器人 - 专业、严谨
- `bot-funny`: 幽默机器人 - 风趣、幽默

### 群组对话模块 (Groups)

#### 获取群组列表
```http
GET /api/group-conversations
Authorization: Bearer {token}
```

#### 创建群组
```http
POST /api/group-conversations
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "技术讨论组",
  "botIds": ["bot-tech", "bot-funny"]
}
```

#### 获取群组详情
```http
GET /api/group-conversations/{groupId}
Authorization: Bearer {token}
```

#### 删除群组
```http
DELETE /api/group-conversations/{groupId}
Authorization: Bearer {token}
```

#### 获取群组消息历史
```http
GET /api/group-conversations/{groupId}/messages?page=1&limit=50
Authorization: Bearer {token}
```

#### 发送群组消息
```http
POST /api/group-conversations/{groupId}/messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "大家好！"
}
```

#### 流式发送群组消息 (SSE)
```http
POST /api/group-conversations/{groupId}/messages/stream
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "大家好！"
}
```

**SSE 事件格式** (群组特有):

1. **用户消息事件** (`userMessage`)
```
event: message
data: {"type":"userMessage","data":{"id":"msg-123","sender_type":"user","sender_name":"testuser","content":"大家好！","created_at":"2025-12-30T..."}}
```

2. **机器人消息开始** (`aiMessageStart`) - 包含机器人名称
```
event: message
data: {"type":"aiMessageStart","data":{"id":"bot-msg-456","sender_type":"bot","sender_name":"客服机器人","created_at":"2025-12-30T..."}}
```

3. **机器人消息内容块** (`aiMessageChunk`) - 逐字符流式输出
```
event: message
data: {"type":"aiMessageChunk","data":{"messageId":"bot-msg-456","sender_name":"客服机器人","content":"您"}}
event: message
data: {"type":"aiMessageChunk","data":{"messageId":"bot-msg-456","sender_name":"客服机器人","content":"好"}}
```

4. **机器人消息结束** (`aiMessageEnd`)
```
event: message
data: {"type":"aiMessageEnd","data":{"messageId":"bot-msg-456","sender_name":"客服机器人","content":"您好！关于您的询问..."}}
```

5. **完成事件** (`done`) - 所有机器人回复完成
```
event: done
data: {"success":true}
```

**接口逻辑说明**:
- 使用 SSE 实现多机器人顺序流式响应
- **防循环机制**: 检查上一条消息的 `sender_type`，如果是 `bot` 则不触发机器人回复
- **顺序输出**: 机器人按 ID 排序依次流式输出完整响应
- **逐字符模拟**: 每个机器人的响应按字符逐个输出 (10-40ms 延迟)
- **完整保存**: 每个机器人的完整响应在传输结束后保存到数据库
- 每个机器人使用预设的回复模板，根据机器人性格生成不同风格的回复

**群组消息逻辑**：
1. 用户发送消息后，所有机器人都会按顺序回复
2. 防止机器人循环对话（只有人类用户消息才触发机器人回复）
3. 每个机器人逐字符流式输出完整响应，下一个机器人在前一个完成后开始

### 标签模块 (Tags)

#### 获取用户的所有标签
```http
GET /api/tags
Authorization: Bearer {token}
```

## 数据库设计

### users 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PRIMARY KEY | 用户 ID |
| username | TEXT UNIQUE | 用户名 |
| email | TEXT UNIQUE | 邮箱 |
| password_hash | TEXT | 密码哈希 |
| created_at | TEXT | 创建时间 |
| updated_at | TEXT | 更新时间 |

### conversations 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PRIMARY KEY | 对话 ID |
| user_id | TEXT | 所属用户 ID |
| title | TEXT | 对话标题 |
| model_id | TEXT | 使用的 AI 模型 ID (默认 gpt-3.5-turbo) |
| created_at | TEXT | 创建时间 |
| updated_at | TEXT | 更新时间 |

### models 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PRIMARY KEY | 模型 ID |
| name | TEXT | 模型名称 |
| provider | TEXT | 提供商 (OpenAI/Anthropic) |
| context_limit | INTEGER | 上下文限制 |
| pricing_per_1k_tokens | TEXT | 每 1k tokens 价格 |
| is_active | INTEGER | 是否激活 (1=激活, 0=停用) |

### conversation_tags 表
| 字段 | 类型 | 说明 |
|------|------|------|
| conversation_id | TEXT | 对话 ID |
| tag | TEXT | 标签 |

### bots 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PRIMARY KEY | 机器人 ID |
| name | TEXT | 机器人名称 |
| personality | TEXT | 性格 |
| description | TEXT | 描述 |
| response_tendency | TEXT | 回复倾向 |

### group_conversations 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PRIMARY KEY | 群组 ID |
| name | TEXT | 群组名称 |
| owner_id | TEXT | 所有者用户 ID |
| created_at | TEXT | 创建时间 |
| updated_at | TEXT | 更新时间 |

### group_conversation_bots 表
| 字段 | 类型 | 说明 |
|------|------|------|
| group_conversation_id | TEXT | 群组 ID |
| bot_id | TEXT | 机器人 ID |

### messages 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PRIMARY KEY | 消息 ID |
| conversation_id | TEXT | 所属对话 ID (可选) |
| group_conversation_id | TEXT | 所属群组 ID (可选) |
| sender_id | TEXT | 发送者 ID |
| sender_type | TEXT | 发送者类型 (user/bot) |
| content | TEXT | 消息内容 |
| ai_error | INTEGER | AI 错误标记 |
| error_message | TEXT | 错误信息 |
| created_at | TEXT | 创建时间 |

## 测试示例

### 预设测试账号

系统已预设两个测试账号，可直接登录使用：

| 用户名 | 邮箱 | 密码 | 说明 |
|--------|------|------|------|
| testuser | test@test.com | 123456 | 测试账号 1 |
| testuser2 | test2@test.com | 123456 | 测试账号 2 |

### 1. 注册新用户
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@test.com","password":"123456"}'
```

### 2. 登录 (使用预设账号)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

保存返回的 `token` 用于后续请求。

### 3. 创建对话
```bash
curl -X POST http://localhost:3000/api/conversations \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"title":"测试对话"}'
```

### 4. 发送消息
```bash
curl -X POST http://localhost:3000/api/conversations/{conversationId}/messages \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"content":"你好，AI！"}'
```

### 5. 创建群组
```bash
curl -X POST http://localhost:3000/api/group-conversations \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"name":"技术讨论组","botIds":["bot-tech","bot-funny"]}'
```

### 6. 发送群组消息
```bash
curl -X POST http://localhost:3000/api/group-conversations/{groupId}/messages \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"content":"大家好！"}'
```

## 核心逻辑说明

### 1. 权限控制
- 所有需要认证的接口必须验证 JWT Token
- 用户只能访问自己的数据
- 删除操作级联删除关联数据

### 2. AI 调用健壮性
- 最多重试 2 次
- 超时时间 30 秒
- 失败后用户消息仍保存
- AI 失败标记在消息中

### 3. 模型切换机制
- **模型存储**: 每个对话独立保存所选模型 ID (`model_id` 字段)
- **模型验证**: 切换模型时验证模型是否在可用列表中且处于激活状态
- **默认模型**: 未指定时使用 `gpt-3.5-turbo`
- **AI 调用**: 消息发送时自动使用对话当前设置的模型
- **响应标识**: AI 响应内容包含模型 ID 前缀，如 `[gpt-4-turbo] 回复内容`

### 4. SSE 流式响应机制
- **连接建立**: 使用 SSE 协议，设置 `text/event-stream` 和 `Cache-Control: no-cache` 头
- **事件顺序**:
  1. 立即发送用户消息事件
  2. 发送 AI 消息开始事件 (创建消息占位符)
  3. 逐字符流式发送 AI 响应内容块 (模拟打字效果)
  4. 发送 AI 消息结束事件 (包含完整内容)
  5. 发送完成事件
- **错误处理**: AI 调用失败时发送错误事件，消息标记为 `ai_error=1`
- **数据持久化**: 用户消息立即保存，AI 消息在流式传输完成后保存

### 5. 群组消息逻辑
- 防止机器人循环对话：检查上一条消息的 `sender_type`，如果是 `bot` 则不触发机器人回复
- 顺序响应：机器人按 ID 排序依次响应，每个机器人完整响应完成后下一个才开始
- 逐字符流式：每个机器人的响应都逐字符输出，模拟真实打字效果 (10-40ms 延迟)
- 个性回复：每个机器人根据预设性格生成不同风格的回复内容

## 开发检查清单

- [x] 用户注册/登录（JWT 认证）
- [x] 个人对话 CRUD
- [x] 对话标签管理
- [x] 发送消息并调用 AI（含重试机制）
- [x] AI 调用失败处理
- [x] 群组创建和管理
- [x] 群组消息（多机器人回复）
- [x] 防止机器人循环对话
- [x] 权限控制（用户只能访问自己的数据）
- [x] 分页功能
- [x] 错误处理和日志
- [x] AI 模型切换功能
- [x] SSE 流式响应（个人对话）
- [x] SSE 流式响应（群组对话）

### 7. 创建群组
```bash
curl -X POST http://localhost:3000/api/group-conversations \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"name":"技术讨论组","botIds":["bot-tech","bot-funny"]}'
```

### 8. 查看可用模型
```bash
curl -X GET http://localhost:3000/api/models \
  -H "Authorization: Bearer {token}"
```

### 9. 创建对话时指定模型
```bash
curl -X POST http://localhost:3000/api/conversations \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"title":"GPT-4 对话","modelId":"gpt-4-turbo"}'
```

### 10. 切换对话的 AI 模型
```bash
curl -X PUT http://localhost:3000/api/conversations/{conversationId}/model \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"modelId":"claude-3-opus"}'
```

### 11. 流式发送消息 (SSE)
```bash
curl -N -X POST http://localhost:3000/api/conversations/{conversationId}/messages/stream \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"content":"你好，请介绍一下你自己"}'
```

**注意**: 使用 `-N` 参数禁用 curl 的缓冲，实时显示 SSE 流式响应

## 加分项

- [x] 流式响应 (SSE)
- [ ] 前端实现
- [ ] 单元测试或集成测试
- [ ] 部署说明文档
- [ ] AI 响应缓存
- [ ] 性能优化（索引已实现）
- [ ] 完善的日志记录

## License

ISC
