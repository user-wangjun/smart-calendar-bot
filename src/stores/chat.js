import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import ZhipuClient from '@/api/zhipuClient.js';
import apiKeyManager from '@/config/apiKeyManager.js';
import envConfig from '@/config/env.js';
import { aiAssistantService } from '@/services/aiAssistantService.js';
// import { IntentType } from '@/services/aiAssistantService.js';

/**
 * 系统模型枚举
 * 定义支持的智谱AI系统模型
 */
const SystemModel = {
  GLM_4_FLASH: 'glm-4-flash',
  GLM_4_FLASH_250414: 'glm-4-flash-250414',
  GLM_4_7_FLASH: 'glm-4.7-flash',
  GLM_4_6V_FLASH: 'glm-4.6v-flash',
  COGVIEW_3_FLASH: 'cogview-3-flash'
};

/**
 * 系统模型配置
 */
const SYSTEM_MODEL_CONFIGS = [
  {
    id: SystemModel.GLM_4_FLASH,
    name: 'GLM-4-Flash',
    description: '通用对话 · 快速响应',
    maxTokens: 4096,
    contextWindow: 4096,
    category: 'free',
    recommended: true
  },
  {
    id: SystemModel.GLM_4_FLASH_250414,
    name: 'GLM-4-Flash-250414',
    description: '通用对话 · 新版本',
    maxTokens: 4096,
    contextWindow: 4096,
    category: 'free',
    recommended: false
  },
  {
    id: SystemModel.GLM_4_7_FLASH,
    name: 'GLM-4.7-Flash',
    description: '复杂推理 · 高性能',
    maxTokens: 4096,
    contextWindow: 4096,
    category: 'free',
    recommended: true
  },
  {
    id: SystemModel.GLM_4_6V_FLASH,
    name: 'GLM-4.6V-Flash',
    description: '图像理解 · 多模态',
    maxTokens: 4096,
    contextWindow: 4096,
    category: 'vision',
    recommended: true
  },
  {
    id: SystemModel.COGVIEW_3_FLASH,
    name: 'CogView-3-Flash',
    description: '图像生成 · 创意设计',
    maxTokens: 4096,
    contextWindow: 4096,
    category: 'vision',
    recommended: false
  }
];

/**
 * 创建系统消息
 */
function createSystemMessage (content) {
  return { role: 'system', content };
}

/**
 * 创建用户消息
 */
function createUserMessage (content) {
  return { role: 'user', content };
}

/**
 * 创建助手消息
 */
function createAssistantMessage (content) {
  return { role: 'assistant', content };
}

/**
 * 聊天状态管理
 * 重构版 - 使用ZhipuClient替代ai-model-architecture
 */
export const useChatStore = defineStore('chat', () => {
  // ============ 状态 ============
  const messages = ref([]);
  const isTyping = ref(false);
  const currentModel = ref(SystemModel.GLM_4_FLASH);
  const error = ref(null);
  const isConnecting = ref(false);
  const conversations = ref([]);
  const currentConversationId = ref(null);
  const streamContent = ref('');

  // 对话上下文（维护最近10轮对话）
  const contextWindow = ref([]);
  const MAX_CONTEXT_LENGTH = 10;

  // 系统提示词
  const SYSTEM_PROMPT = `你是一个智能日历助手，可以帮助用户管理日程、查询天气、设置提醒等。
你可以理解自然语言指令，并与用户进行多轮对话。
当用户提到日程、提醒、任务时，请提取关键信息（时间、地点、内容等）。

当前支持的命令：
- 日程管理：添加、修改、删除、查询日程
- 天气查询：查询当前天气和预报
- 提醒设置：设置定时提醒
- 待办事项：创建和管理待办任务`;

  // 功能调用模式（是否优先使用本地功能）
  const useFunctionMode = ref(true);

  // ZhipuClient实例
  let zhipuClient = null;

  /**
   * 获取或创建ZhipuClient实例
   */
  const getZhipuClient = () => {
    if (!zhipuClient) {
      zhipuClient = new ZhipuClient();
    }
    return zhipuClient;
  };

  // ============ 计算属性 ============
  const messageCount = computed(() => messages.value.length);
  const lastMessage = computed(() => messages.value[messages.value.length - 1]);

  const currentModelInfo = computed(() => {
    return SYSTEM_MODEL_CONFIGS.find(m => m.id === currentModel.value);
  });

  const currentConversation = computed(() => {
    return conversations.value.find(c => c.id === currentConversationId.value);
  });

  // ============ 方法 ============

  /**
   * 初始化API密钥
   */
  const initApiKey = (apiKey) => {
    if (apiKey) {
      zhipuClient = new ZhipuClient({ apiKey });
    }
  };

  /**
   * 添加用户消息
   */
  const addUserMessage = (content) => {
    const message = {
      id: Date.now(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };
    messages.value.push(message);
    updateContext('user', content);
    saveToLocalStorage();
    return message;
  };

  /**
   * 添加AI回复
   */
  const addAssistantMessage = (content, isStreaming = false) => {
    if (isStreaming && messages.value.length > 0) {
      // 更新最后一条AI消息（流式）
      const lastMsg = messages.value[messages.value.length - 1];
      if (lastMsg.role === 'assistant' && lastMsg.isStreaming) {
        lastMsg.content = content;
        return lastMsg;
      }
    }

    const message = {
      id: Date.now(),
      role: 'assistant',
      content,
      isStreaming,
      timestamp: new Date().toISOString()
    };
    messages.value.push(message);

    if (!isStreaming) {
      updateContext('assistant', content);
      saveToLocalStorage();
    }

    return message;
  };

  /**
   * 更新对话上下文
   */
  const updateContext = (role, content) => {
    contextWindow.value.push({ role, content });
    if (contextWindow.value.length > MAX_CONTEXT_LENGTH * 2) {
      contextWindow.value = contextWindow.value.slice(-MAX_CONTEXT_LENGTH * 2);
    }
  };

  /**
   * 设置AI正在输入状态
   */
  const setTyping = (typing) => {
    isTyping.value = typing;
  };

  /**
   * 设置当前使用的模型
   */
  const setCurrentModel = (model) => {
    currentModel.value = model;
    localStorage.setItem('chat_model', model);
  };

  /**
   * 发送消息到AI（普通模式）
   */
  const sendToAI = async (message) => {
    isConnecting.value = true;
    error.value = null;

    try {
      const client = getZhipuClient();

      if (!client.isValid()) {
        const apiKey = import.meta.env.VITE_ZHIPU_API_KEY;
        if (apiKey) {
          initApiKey(apiKey);
        } else {
          throw new Error('请先配置智谱AI API密钥');
        }
      }

      const chatMessages = [
        createSystemMessage(SYSTEM_PROMPT),
        ...contextWindow.value.map(msg =>
          msg.role === 'user'
            ? createUserMessage(msg.content)
            : createAssistantMessage(msg.content)
        ),
        createUserMessage(message)
      ];

      const response = await client.sendMessage({
        model: currentModel.value,
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 2048
      });

      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isConnecting.value = false;
    }
  };

  /**
   * 发送消息到AI（流式模式）
   */
  const sendToAIStream = async (message, onChunk) => {
    isConnecting.value = true;
    error.value = null;
    streamContent.value = '';

    try {
      const client = getZhipuClient();

      if (!client.isValid()) {
        const apiKey = import.meta.env.VITE_ZHIPU_API_KEY;
        if (apiKey) {
          initApiKey(apiKey);
        } else {
          throw new Error('请先配置智谱AI API密钥');
        }
      }

      const chatMessages = [
        createSystemMessage(SYSTEM_PROMPT),
        ...contextWindow.value.map(msg =>
          msg.role === 'user'
            ? createUserMessage(msg.content)
            : createAssistantMessage(msg.content)
        ),
        createUserMessage(message)
      ];

      const response = await client.sendStreamMessage(
        {
          model: currentModel.value,
          messages: chatMessages,
          temperature: 0.7,
          max_tokens: 2048
        },
        (chunk) => {
          streamContent.value += chunk;
          if (onChunk) {
            onChunk(chunk, streamContent.value);
          }
        }
      );

      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isConnecting.value = false;
    }
  };

  /**
   * 处理用户消息（智能助手模式）
   * 先尝试本地功能调用，再使用AI生成回复
   */
  const processUserMessage = async (userMessage) => {
    // 1. 使用智能助手服务处理消息
    const result = await aiAssistantService.processMessage(userMessage);

    // 2. 如果本地功能成功执行，直接返回结果
    if (result.type === 'function' && result.content) {
      return {
        content: result.content,
        type: 'function',
        intent: result.intent,
        data: result.data
      };
    }

    // 3. 如果需要AI生成回复
    return null;
  };

  /**
   * 获取AI响应（带重试）
   */
  const getAIResponse = async (userMessage, useStream = false, onChunk) => {
    try {
      // 首先尝试本地功能处理
      if (useFunctionMode.value) {
        const localResult = await processUserMessage(userMessage);
        if (localResult) {
          return localResult;
        }
      }

      // 使用AI生成回复
      if (useStream) {
        const response = await sendToAIStream(userMessage, onChunk);
        return {
          content: streamContent.value,
          usage: response.usage,
          type: 'ai'
        };
      } else {
        const response = await sendToAI(userMessage);
        return {
          content: response.choices[0].message.content,
          usage: response.usage,
          type: 'ai'
        };
      }
    } catch (err) {
      console.error('获取AI响应失败:', err);
      throw err;
    }
  };

  /**
   * 创建新对话
   */
  const createConversation = (title = '新对话') => {
    const conversation = {
      id: Date.now().toString(),
      title,
      timestamp: new Date().toISOString(),
      messageCount: 0
    };
    conversations.value.unshift(conversation);
    currentConversationId.value = conversation.id;
    messages.value = [];
    contextWindow.value = [];
    saveToLocalStorage();
    return conversation;
  };

  /**
   * 切换对话
   */
  const switchConversation = (conversationId) => {
    const conversation = conversations.value.find(c => c.id === conversationId);
    if (conversation) {
      currentConversationId.value = conversationId;
      // 加载该对话的消息（从本地存储）
      loadConversationMessages(conversationId);
    }
  };

  /**
   * 删除对话
   */
  const deleteConversation = (conversationId) => {
    conversations.value = conversations.value.filter(c => c.id !== conversationId);
    localStorage.removeItem(`chat_messages_${conversationId}`);

    if (currentConversationId.value === conversationId) {
      if (conversations.value.length > 0) {
        switchConversation(conversations.value[0].id);
      } else {
        createConversation();
      }
    }
    saveToLocalStorage();
  };

  /**
   * 更新对话标题
   */
  const updateConversationTitle = (conversationId, title) => {
    const conversation = conversations.value.find(c => c.id === conversationId);
    if (conversation) {
      conversation.title = title;
      saveToLocalStorage();
    }
  };

  /**
   * 加载指定对话的消息
   */
  const loadConversationMessages = (conversationId) => {
    try {
      const saved = localStorage.getItem(`chat_messages_${conversationId}`);
      if (saved) {
        messages.value = JSON.parse(saved);
        // 重建上下文
        contextWindow.value = messages.value
          .filter(m => m.role === 'user' || m.role === 'assistant')
          .slice(-MAX_CONTEXT_LENGTH * 2)
          .map(m => ({ role: m.role, content: m.content }));
      } else {
        messages.value = [];
        contextWindow.value = [];
      }
    } catch (err) {
      console.error('加载对话消息失败:', err);
      messages.value = [];
      contextWindow.value = [];
    }
  };

  /**
   * 从本地存储加载数据
   */
  const loadFromLocalStorage = () => {
    try {
      // 加载对话列表
      const savedConversations = localStorage.getItem('chat_conversations');
      if (savedConversations) {
        conversations.value = JSON.parse(savedConversations);
      }

      // 加载当前对话ID
      const savedCurrentId = localStorage.getItem('chat_current_conversation');
      if (savedCurrentId) {
        currentConversationId.value = savedCurrentId;
        loadConversationMessages(savedCurrentId);
      } else if (conversations.value.length === 0) {
        createConversation();
      }

      // 加载当前模型
      const savedModel = localStorage.getItem('chat_model');
      if (savedModel && Object.values(SystemModel).includes(savedModel)) {
        currentModel.value = savedModel;
      }
    } catch (err) {
      console.error('加载数据失败:', err);
      createConversation();
    }
  };

  /**
   * 保存到本地存储
   */
  const saveToLocalStorage = () => {
    try {
      // 保存对话列表
      localStorage.setItem('chat_conversations', JSON.stringify(conversations.value));

      // 保存当前对话ID
      if (currentConversationId.value) {
        localStorage.setItem('chat_current_conversation', currentConversationId.value);
      }

      // 保存当前消息
      if (currentConversationId.value) {
        localStorage.setItem(`chat_messages_${currentConversationId.value}`, JSON.stringify(messages.value));
      }

      // 更新对话消息数
      const conversation = conversations.value.find(c => c.id === currentConversationId.value);
      if (conversation) {
        conversation.messageCount = messages.value.length;
      }
    } catch (err) {
      console.error('保存数据失败:', err);
    }
  };

  /**
   * 清空当前对话
   */
  const clearMessages = () => {
    messages.value = [];
    contextWindow.value = [];
    saveToLocalStorage();
  };

  /**
   * 删除指定消息
   */
  const deleteMessage = (messageId) => {
    messages.value = messages.value.filter(msg => msg.id !== messageId);
    saveToLocalStorage();
  };

  /**
   * 获取可用模型列表
   */
  const getAvailableModels = () => {
    return SYSTEM_MODEL_CONFIGS;
  };

  /**
   * 检查模型可用性
   */
  const checkModelAvailability = async () => {
    try {
      const client = getZhipuClient();
      return client.isValid();
    } catch (err) {
      return false;
    }
  };

  // ============ 初始化 ============
  loadFromLocalStorage();

  return {
    // 状态
    messages,
    isTyping,
    currentModel,
    error,
    isConnecting,
    conversations,
    currentConversationId,
    streamContent,
    contextWindow,

    // 计算属性
    messageCount,
    lastMessage,
    currentModelInfo,
    currentConversation,

    // 方法
    initApiKey,
    addUserMessage,
    addAssistantMessage,
    setTyping,
    setCurrentModel,
    sendToAI,
    sendToAIStream,
    getAIResponse,
    processUserMessage,
    createConversation,
    switchConversation,
    deleteConversation,
    updateConversationTitle,
    clearMessages,
    deleteMessage,
    getAvailableModels,
    checkModelAvailability,
    saveToLocalStorage,
    loadFromLocalStorage
  };
});
