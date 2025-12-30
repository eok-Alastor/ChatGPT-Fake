import { AIResponse } from '../types';

const MAX_RETRIES = 2;
const TIMEOUT_MS = 30000;

// Simple echo-based mock AI service
// In production, you would replace this with a real AI API call
async function callAIAPI(content: string, modelId: string): Promise<AIResponse> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));

  // Echo the user's message with model prefix
  const responseContent = `[${modelId}] ${content}`;

  return {
    content: responseContent,
    success: true
  };
}

// Streaming version of AI call (simulated)
// Returns an async generator that yields chunks of the response
async function* callAIAPIStream(content: string, modelId: string): AsyncGenerator<string, void, unknown> {
  const responseContent = `[${modelId}] ${content}`;

  // Simulate streaming by yielding characters one by one
  const words = responseContent.split('');
  for (const char of words) {
    // Simulate typing delay (10-50ms per character)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 40 + 10));
    yield char;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function callAIWithRetry(content: string, modelId: string = 'gpt-3.5-turbo'): Promise<AIResponse> {
  const lastError: Error[] = [];

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Add timeout
      const result = await Promise.race([
        callAIAPI(content, modelId),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI API 调用超时')), TIMEOUT_MS)
        )
      ]);

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      lastError.push(err);

      console.error(`AI API 调用失败 (尝试 ${attempt + 1}/${MAX_RETRIES + 1}):`, err.message);

      // If not the last attempt, wait before retrying with exponential backoff
      if (attempt < MAX_RETRIES) {
        const delay = 1000 * (attempt + 1);
        console.log(`等待 ${delay}ms 后重试...`);
        await sleep(delay);
      }
    }
  }

  // All retries failed
  return {
    content: '',
    success: false,
    error: `AI 服务暂时不可用: ${lastError[lastError.length - 1].message}`
  };
}

// Bot-specific responses for group conversations
export async function callBotAI(
  botId: string,
  botName: string,
  content: string
): Promise<AIResponse> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 100));

  // Bot-specific response patterns
  const responses: Record<string, string[]> = {
    'bot-cs': [
      `您好！我是客服机器人。关于您的询问"${content}"，我很乐意帮助您。`,
      `感谢您的提问！客服机器人为您服务。您提到的是"${content}"对吗？`,
      `您好！关于"${content}"这个问题，让我来为您解答。`
    ],
    'bot-tech': [
      `从技术角度来看，您提到的"${content}"涉及以下要点...`,
      `作为技术机器人，我分析您的问题"${content}"需要考虑架构设计。`,
      `技术层面分析"${content}"：这是一个很好的问题。`
    ],
    'bot-funny': [
      `哈哈！关于"${content}"，让我开个玩笑~`,
      `哎呀，"${content}"这个问题很有趣！让我轻松回答一下。`,
      `嘿嘿！您说的"${content}"让我想起一个笑话...`
    ]
  };

  const botResponses = responses[botId];
  const randomResponse =
    botResponses && botResponses.length > 0
      ? botResponses[Math.floor(Math.random() * botResponses.length)]
      : `[${botName}] 收到您的消息: ${content}`;

  return {
    content: randomResponse,
    success: true
  };
}

// Export streaming function
export { callAIAPIStream };
