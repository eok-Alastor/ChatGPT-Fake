# 后端 API 实现清单

## 基础信息

- **Base URL**: `http://localhost:3000/api`
- **认证方式**: JWT Bearer Token
- **响应格式**: JSON

---

## 1. 认证模块 (Auth)

### 1.1 用户注册
```
POST /api/auth/register
```

**请求体:**
```json
{
  "username": "string (2-50字符)",
  "email": "string (邮箱格式)",
  "password": "string (最少6位)"
}
```

**成功响应 (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "createdAt": "ISO日期",
      "updatedAt": "ISO日期"
    },
    "token": "JWT Token"
  }
}
```

**错误响应 (400):**
```json
{
  "success": false,
  "error": "错误信息"
}
```

---

### 1.2 用户登录
```
POST /api/auth/login
```

**请求体:**
```json
{
  "email": "string (邮箱格式)",
  "password": "string"
}
```

**成功响应 (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string"
    },
    "token": "JWT Token"
  }
}
```

**错误响应 (401):**
```json
{
  "success": false,
  "error": "邮箱或密码错误"
}
```

---

### 1.3 获取当前用户
```
GET /api/auth/me
Headers: Authorization: Bearer {token}
```

**成功响应 (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "createdAt": "ISO日期",
    "updatedAt": "ISO日期"
  }
}
```

---

## 2. 个人对话模块 (Conversations)

### 2.1 获取对话列表
```
GET /api/conversations?tag=可选&page=1&limit=20
Headers: Authorization: Bearer {token}
```

**查询参数:**
- `tag` (可选): 按标签筛选
- `page` (默认1): 页码
- `limit` (默认20): 每页数量

**成功响应 (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "title": "string",
      "tags": ["标签1", "标签2"],
      "createdAt": "ISO日期",
      "updatedAt": "ISO日期",
      "lastMessage": {
        "id": "uuid",
        "content": "最后一条消息",
        "createdAt": "ISO日期"
      }
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

---

### 2.2 创建对话
```
POST /api/conversations
Headers: Authorization: Bearer {token}
```

**请求体:**
```json
{
  "title": "string (可选)"
}
```

**成功响应 (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "title": "string",
    "tags": [],
    "createdAt": "ISO日期",
    "updatedAt": "ISO日期"
  }
}
```

---

### 2.3 获取对话详情
```
GET /api/conversations/{conversationId}
Headers: Authorization: Bearer {token}
```

**成功响应 (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "title": "string",
    "tags": ["标签1"],
    "createdAt": "ISO日期",
    "updatedAt": "ISO日期"
  }
}
```

---

### 2.4 更新对话标题
```
PATCH /api/conversations/{conversationId}
Headers: Authorization: Bearer {token}
```

**请求体:**
```json
{
  "title": "新的对话标题"
}
```

**成功响应 (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "新的对话标题",
    "tags": [],
    "updatedAt": "ISO日期"
  }
}
```

---

### 2.5 更新对话标签
```
PATCH /api/conversations/{conversationId}/tags
Headers: Authorization: Bearer {token}
```

**请求体:**
```json
{
  "tags": ["工作", "学习"]
}
```

**成功响应 (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tags": ["工作", "学习"],
    "updatedAt": "ISO日期"
  }
}
```

---

### 2.6 删除对话
```
DELETE /api/conversations/{conversationId}
Headers: Authorization: Bearer {token}
```

**成功响应 (200):**
```json
{
  "success": true,
  "message": "对话已删除"
}
```

---

## 3. 消息模块 (Messages)

### 3.1 获取对话消息列表
```
GET /api/conversations/{conversationId}/messages?page=1&limit=50
Headers: Authorization: Bearer {token}
```

**成功响应 (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "conversationId": "uuid",
      "senderId": "uuid",
      "senderType": "user",
      "content": "消息内容",
      "createdAt": "ISO日期",
      "aiError": false
    },
    {
      "id": "uuid",
      "conversationId": "uuid",
      "senderId": "bot-001",
      "senderType": "bot",
      "content": "AI回复",
      "createdAt": "ISO日期"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 50
  }
}
```

---

### 3.2 发送消息
```
POST /api/conversations/{conversationId}/messages
Headers: Authorization: Bearer {token}
```

**请求体:**
```json
{
  "content": "用户消息内容"
}
```

**成功响应 (201):**
```json
{
  "success": true,
  "data": {
    "userMessage": {
      "id": "uuid",
      "senderType": "user",
      "content": "用户消息内容",
      "createdAt": "ISO日期"
    },
    "aiMessage": {
      "id": "uuid",
      "senderType": "bot",
      "content": "AI回复内容",
      "createdAt": "ISO日期"
    }
  }
}
```

**AI调用失败响应 (202):**
```json
{
  "success": true,
  "data": {
    "userMessage": {
      "id": "uuid",
      "senderType": "user",
      "content": "用户消息内容",
      "createdAt": "ISO日期"
    },
    "aiMessage": null,
    "error": {
      "message": "AI服务暂时不可用，请稍后再试",
      "retryable": true
    }
  }
}
```

**重要:**
- 用户消息必须保存，即使 AI 调用失败
- AI 失败需要实现重试机制（最多2次）
- 超时时间：30秒

---

## 4. 机器人模块 (Bots)

### 4.1 获取所有可用机器人
```
GET /api/bots
Headers: Authorization: Bearer {token}
```

**成功响应 (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "bot-cs",
      "name": "客服机器人",
      "personality": "友善、耐心",
      "description": "专门处理客户咨询",
      "responseTendency": "主动提供帮助"
    },
    {
      "id": "bot-tech",
      "name": "技术机器人",
      "personality": "专业、严谨",
      "description": "负责技术问题解答",
      "responseTendency": "详细解释技术细节"
    },
    {
      "id": "bot-funny",
      "name": "幽默机器人",
      "personality": "风趣、幽默",
      "description": "调节气氛",
      "responseTendency": "加入幽默元素"
    }
  ]
}
```

**注意:** 这些机器人可以硬编码在后端数据库中

---

## 5. 群组对话模块 (Groups)

### 5.1 获取群组列表
```
GET /api/group-conversations
Headers: Authorization: Bearer {token}
```

**成功响应 (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "技术讨论组",
      "ownerId": "uuid",
      "botIds": ["bot-tech", "bot-funny"],
      "createdAt": "ISO日期",
      "updatedAt": "ISO日期",
      "lastMessage": {
        "content": "最后一条消息",
        "senderType": "bot",
        "senderName": "技术机器人",
        "createdAt": "ISO日期"
      }
    }
  ]
}
```

---

### 5.2 创建群组
```
POST /api/group-conversations
Headers: Authorization: Bearer {token}
```

**请求体:**
```json
{
  "name": "群组名称 (1-100字符)",
  "botIds": ["bot-cs", "bot-tech"]
}
```

**成功响应 (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "群组名称",
    "ownerId": "uuid",
    "botIds": ["bot-cs", "bot-tech"],
    "createdAt": "ISO日期",
    "updatedAt": "ISO日期"
  }
}
```

---

### 5.3 获取群组详情
```
GET /api/group-conversations/{groupId}
Headers: Authorization: Bearer {token}
```

**成功响应 (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "群组名称",
    "ownerId": "uuid",
    "bots": [
      {
        "id": "bot-tech",
        "name": "技术机器人",
        "personality": "专业",
        "description": "技术支持",
        "responseTendency": "详细解释"
      }
    ],
    "createdAt": "ISO日期",
    "updatedAt": "ISO日期"
  }
}
```

---

### 5.4 删除群组
```
DELETE /api/group-conversations/{groupId}
Headers: Authorization: Bearer {token}
```

**成功响应 (200):**
```json
{
  "success": true,
  "message": "群组已删除"
}
```

---

### 5.5 获取群组消息历史
```
GET /api/group-conversations/{groupId}/messages?page=1&limit=50
Headers: Authorization: Bearer {token}
```

**成功响应 (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "groupConversationId": "uuid",
      "senderId": "uuid",
      "senderType": "user",
      "senderName": "张三",
      "content": "用户消息",
      "createdAt": "ISO日期"
    },
    {
      "id": "uuid",
      "groupConversationId": "uuid",
      "senderId": "bot-tech",
      "senderType": "bot",
      "senderName": "技术机器人",
      "content": "AI回复",
      "createdAt": "ISO日期"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 50
  }
}
```

---

### 5.6 发送群组消息
```
POST /api/group-conversations/{groupId}/messages
Headers: Authorization: Bearer {token}
```

**请求体:**
```json
{
  "content": "用户消息"
}
```

**成功响应 (201):**
```json
{
  "success": true,
  "data": {
    "userMessage": {
      "id": "uuid",
      "senderId": "uuid",
      "senderType": "user",
      "content": "用户消息",
      "createdAt": "ISO日期"
    },
    "botMessages": [
      {
        "id": "uuid",
        "senderId": "bot-tech",
        "senderType": "bot",
        "senderName": "技术机器人",
        "content": "技术机器人的回复",
        "createdAt": "ISO日期"
      },
      {
        "id": "uuid",
        "senderId": "bot-cs",
        "senderType": "bot",
        "senderName": "客服机器人",
        "content": "客服机器人的回复",
        "createdAt": "ISO日期"
      }
    ]
  }
}
```

**群组消息逻辑要求:**
1. 用户发送消息后，至少一个机器人回复
2. 防止机器人之间循环对话
3. 机器人只回复人类用户的消息

---

## 6. 标签模块 (Tags)

### 6.1 获取用户的所有标签
```
GET /api/tags
Headers: Authorization: Bearer {token}
```

**成功响应 (200):**
```json
{
  "success": true,
  "data": [
    {
      "name": "工作",
      "count": 5
    },
    {
      "name": "学习",
      "count": 3
    }
  ]
}
```

**说明:** count 表示使用该标签的对话数量

---

## 数据库设计

### users 表
```sql
id              UUID PRIMARY KEY
username        VARCHAR(50) UNIQUE NOT NULL
email           VARCHAR(100) UNIQUE NOT NULL
password_hash   VARCHAR(255) NOT NULL
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### conversations 表
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id) ON DELETE CASCADE
title           VARCHAR(255) NOT NULL
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### conversation_tags 表
```sql
conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE
tag             VARCHAR(50) NOT NULL
PRIMARY KEY (conversation_id, tag)
```

### bots 表
```sql
id                  VARCHAR(50) PRIMARY KEY
name                VARCHAR(100) NOT NULL
personality         VARCHAR(255)
description         TEXT
response_tendency   VARCHAR(255)
created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### group_conversations 表
```sql
id              UUID PRIMARY KEY
name            VARCHAR(255) NOT NULL
owner_id        UUID REFERENCES users(id) ON DELETE CASCADE
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### group_conversation_bots 表
```sql
group_conversation_id   UUID REFERENCES group_conversations(id) ON DELETE CASCADE
bot_id                  VARCHAR(50) REFERENCES bots(id) ON DELETE CASCADE
PRIMARY KEY (group_conversation_id, bot_id)
```

### messages 表
```sql
id                    UUID PRIMARY KEY
conversation_id       UUID REFERENCES conversations(id) ON DELETE CASCADE
group_conversation_id UUID REFERENCES group_conversations(id) ON DELETE CASCADE
sender_id             VARCHAR(255) NOT NULL
sender_type           VARCHAR(10) NOT NULL CHECK (sender_type IN ('user', 'bot'))
content               TEXT NOT NULL
ai_error              BOOLEAN DEFAULT FALSE
error_message         TEXT
created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP

-- 确保 conversation_id 和 group_conversation_id 互斥
CHECK (
  (conversation_id IS NOT NULL AND group_conversation_id IS NULL) OR
  (conversation_id IS NULL AND group_conversation_id IS NOT NULL)
)
```

---

## 核心逻辑要求

### 1. 权限控制
- 所有需要认证的接口必须验证 JWT Token
- 用户只能访问自己的数据（conversations, groups, messages）
- 删除操作级联删除关联数据

### 2. AI 调用健壮性
```typescript
// 伪代码
async function callAI(content) {
  const maxRetries = 2;
  const timeout = 30000;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await fetchAI(content, { timeout });
      return response;
    } catch (error) {
      if (i === maxRetries) {
        throw error; // 最后一次重试失败
      }
      await sleep(1000 * (i + 1)); // 递增延迟
    }
  }
}
```

### 3. 群组消息逻辑
```typescript
// 防止机器人循环对话
async function sendGroupMessage(groupId, userId, content) {
  // 1. 保存用户消息
  const userMessage = await saveMessage(userId, 'user', content);

  // 2. 检查最后一条消息是否来自机器人
  const lastMessage = await getLastMessage(groupId);
  if (lastMessage?.senderType === 'bot') {
    return { userMessage, botMessages: [] };
  }

  // 3. 获取群组中的所有机器人
  const bots = await getGroupBots(groupId);

  // 4. 触发机器人回复（至少一个）
  const botMessages = await triggerBotResponses(bots, content);

  return { userMessage, botMessages };
}
```

---

## 测试数据

### 预设机器人（插入 bots 表）
```sql
INSERT INTO bots (id, name, personality, description, response_tendency) VALUES
('bot-cs', '客服机器人', '友善、耐心', '专门处理客户咨询', '主动提供帮助'),
('bot-tech', '技术机器人', '专业、严谨', '负责技术问题解答', '详细解释技术细节'),
('bot-funny', '幽默机器人', '风趣、幽默', '调节气氛', '加入幽默元素');
```

### 测试用户
```
username: testuser
email: test@test.com
password: 123456
```

---

## 开发检查清单

- [ ] 用户注册/登录（JWT 认证）
- [ ] 个人对话 CRUD
- [ ] 对话标签管理
- [ ] 发送消息并调用 AI（含重试机制）
- [ ] AI 调用失败处理
- [ ] 群组创建和管理
- [ ] 群组消息（多机器人回复）
- [ ] 防止机器人循环对话
- [ ] 权限控制（用户只能访问自己的数据）
- [ ] 分页功能
- [ ] 错误处理和日志
