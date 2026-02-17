<template>
  <div class="ai-assistant-container">
    <!-- 遮罩层 -->
    <div class="overlay" :class="{ show: showMobileSidebar }" @click="toggleSidebar"></div>

    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ open: showMobileSidebar }">
      <div class="sidebar-header">
        <button class="new-chat-btn" @click="startNewChat">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          新建对话
        </button>
      </div>

      <div class="chat-history" id="chatHistory">
        <div
          v-for="chat in chatHistory"
          :key="chat.id"
          class="history-item"
          :class="{ active: chat.id === currentChatId }"
          @click="switchChat(chat.id)"
        >
          <svg class="history-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span class="history-text">{{ chat.title }}</span>
        </div>
      </div>

      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">{{ userInitials }}</div>
          <div class="user-details">
            <div class="user-name">{{ userName }}</div>
            <div class="user-role">高级用户</div>
          </div>
        </div>
      </div>
    </aside>

    <!-- 主聊天区域 -->
    <main class="main-container">
      <!-- 顶部导航栏 -->
      <header class="chat-header">
        <div class="header-left">
          <button class="menu-toggle" id="menuToggle" @click="toggleSidebar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <h1 class="chat-title">AI智能助手</h1>
          <select class="model-selector" v-model="currentModel" @change="handleModelChange">
            <option v-for="model in availableModels" :key="model.id" :value="model.id">
              {{ model.name }} · {{ model.description || '通用模型' }}
            </option>
          </select>
        </div>

        <div class="header-right">
          <button class="header-btn" title="清空对话" @click="clearChat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
          <button class="header-btn" title="设置" @click="showSettings = true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        </div>
      </header>

      <!-- 消息区域 -->
      <div class="chat-messages" ref="messagesContainer">
        <!-- 欢迎界面 -->
        <div v-if="messages.length === 0" class="welcome-screen" id="welcomeScreen">
          <div class="welcome-icon">🤖</div>
          <h2 class="welcome-title">小珺</h2>
          <p class="welcome-subtitle">我可以帮助你解答问题、编写代码、分析数据，或进行创意写作。选择下方的快捷功能开始对话吧！</p>
          <div class="quick-actions">
            <button class="quick-action-btn" @click="sendQuickMessage('请帮我写一段Python代码')">
              <div class="quick-action-icon">💻</div>
              <div class="quick-action-text">编写代码</div>
            </button>
            <button class="quick-action-btn" @click="sendQuickMessage('请解释什么是机器学习')">
              <div class="quick-action-icon">📚</div>
              <div class="quick-action-text">知识问答</div>
            </button>
            <button class="quick-action-btn" @click="sendQuickMessage('请帮我写一封商务邮件')">
              <div class="quick-action-icon">✉️</div>
              <div class="quick-action-text">文案创作</div>
            </button>
            <button class="quick-action-btn" @click="sendQuickMessage('请分析这段数据')">
              <div class="quick-action-icon">📊</div>
              <div class="quick-action-text">数据分析</div>
            </button>
            <button class="quick-action-btn add-event-btn" @click="openEventDialog">
              <div class="quick-action-icon">📅</div>
              <div class="quick-action-text">添加日程</div>
            </button>
          </div>
        </div>

        <!-- 消息列表 -->
        <template v-else>
          <div
            v-for="message in messages"
            :key="message.id"
            class="message"
            :class="message.role"
          >
            <div class="message-avatar">{{ message.role === 'user' ? userInitials : '🤖' }}</div>
            <div class="message-content">
              <div class="message-bubble" v-html="formatMessage(message.content)"></div>
              <div class="message-time">{{ formatTime(message.timestamp) }}</div>
            </div>
          </div>

          <!-- 加载指示器 -->
          <div v-if="isTyping" class="message ai">
            <div class="message-avatar">🤖</div>
            <div class="message-content">
              <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- 输入区域 -->
      <div class="chat-input-container">
        <div class="input-wrapper">
          <div class="input-actions">
            <button class="input-action-btn" title="语音输入">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
            </button>
            <button class="input-action-btn" title="上传文件">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2-2.4-3.5-4.4-3.5h-1.2c-.7-3.2-3.5-5.6-6.8-5.6-3.7 0-6.7 3-6.9 6.7-.2 3.3 2.4 6.2 5.7 6.5H9"></path>
                <polyline points="16 16 12 12 8 16"></polyline>
                <line x1="12" y1="12" x2="12" y2="21"></line>
              </svg>
            </button>
          </div>
          <textarea
            class="message-input"
            v-model="inputMessage"
            placeholder="输入消息...（Enter发送，Shift+Enter换行）"
            rows="1"
            @keydown="handleKeyDown"
            @input="autoResize"
            ref="textareaRef"
          ></textarea>
          <button class="send-btn" @click="sendMessage" :disabled="!inputMessage.trim() || isTyping">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </main>

    <!-- 设置弹窗 -->
    <Teleport to="body">
      <div v-if="showSettings" class="modal-overlay" @click="showSettings = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>设置</h3>
            <button class="modal-close" @click="showSettings = false">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="setting-item">
              <label>默认模型</label>
              <select v-model="currentModel" @change="handleModelChange">
                <option v-for="model in availableModels" :key="model.id" :value="model.id">
                  {{ model.name }} · {{ model.description || '通用模型' }}
                </option>
              </select>
            </div>
            <div class="setting-item">
              <button class="clear-all-btn" @click="clearAllData">清空所有对话数据</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 添加日程弹窗 -->
    <Teleport to="body">
      <div v-if="showEventDialog" class="modal-overlay" @click="closeEventDialog">
        <div class="event-modal-content" @click.stop>
          <div class="modal-header">
            <h3>{{ isEditingEvent ? '编辑日程' : '添加日程' }}</h3>
            <button class="modal-close" @click="closeEventDialog">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <!-- 事件标题 -->
            <div class="event-field">
              <label class="event-label">
                事件标题 <span class="required">*</span>
              </label>
              <input
                v-model="eventForm.title"
                type="text"
                class="event-input"
                placeholder="请输入事件标题"
                :class="{ 'is-error': eventErrors.title }"
              />
              <span v-if="eventErrors.title" class="error-text">{{ eventErrors.title }}</span>
            </div>

            <!-- 日期选择 -->
            <div class="event-field">
              <label class="event-label">
                日期 <span class="required">*</span>
              </label>
              <input
                v-model="eventForm.date"
                type="date"
                class="event-input"
                :class="{ 'is-error': eventErrors.date }"
              />
              <span v-if="eventErrors.date" class="error-text">{{ eventErrors.date }}</span>
            </div>

            <!-- 时间选择 -->
            <div class="event-field-row">
              <div class="event-field half">
                <label class="event-label">开始时间</label>
                <input
                  v-model="eventForm.startTime"
                  type="time"
                  class="event-input"
                />
              </div>
              <div class="event-field half">
                <label class="event-label">结束时间</label>
                <input
                  v-model="eventForm.endTime"
                  type="time"
                  class="event-input"
                />
              </div>
            </div>

            <!-- 地点 -->
            <div class="event-field">
              <label class="event-label">地点</label>
              <input
                v-model="eventForm.location"
                type="text"
                class="event-input"
                placeholder="请输入地点（可选）"
              />
            </div>

            <!-- 描述 -->
            <div class="event-field">
              <label class="event-label">描述</label>
              <textarea
                v-model="eventForm.description"
                class="event-textarea"
                rows="3"
                placeholder="请输入事件描述（可选）"
              ></textarea>
            </div>

            <!-- 提醒设置 -->
            <div class="event-field">
              <label class="event-label">提醒</label>
              <select v-model="eventForm.reminder" class="event-select">
                <option value="none">不提醒</option>
                <option value="5">提前5分钟</option>
                <option value="15">提前15分钟</option>
                <option value="30">提前30分钟</option>
                <option value="60">提前1小时</option>
                <option value="1440">提前1天</option>
              </select>
            </div>

            <!-- 重复设置 -->
            <div class="event-field">
              <label class="event-label">重复</label>
              <select v-model="eventForm.recurrence" class="event-select">
                <option value="none">不重复</option>
                <option value="daily">每天</option>
                <option value="weekly">每周</option>
                <option value="monthly">每月</option>
                <option value="yearly">每年</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="closeEventDialog">取消</button>
            <button class="btn-save" @click="saveEvent" :disabled="!isEventValid || isSaving">
              <span v-if="isSaving" class="loading-spinner"></span>
              <span v-else>{{ isEditingEvent ? '保存修改' : '创建日程' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 错误提示 -->
    <Teleport to="body">
      <div v-if="error" class="error-toast">
        <span>{{ error }}</span>
        <button @click="error = null">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
/**
 * AI智能助手组件
 * 基于源网页界面复制，集成项目现有AI服务功能
 *
 * @author AI助手
 * @date 2026-02-12
 */
import { ref, computed, onMounted, nextTick } from 'vue';
import { useChatStore } from '@/stores/chat';
import { useUserProfileStore } from '@/stores/userProfile';
import { useEventsStore } from '@/stores/events';

// 状态管理
const chatStore = useChatStore();
const userProfile = useUserProfileStore();
const eventsStore = useEventsStore();

// 响应式状态
const inputMessage = ref('');
const showMobileSidebar = ref(false);
const showSettings = ref(false);
const messagesContainer = ref(null);
const textareaRef = ref(null);
const error = ref(null);

// 事件相关状态
const showEventDialog = ref(false);
const isEditingEvent = ref(false);
const editingEventId = ref(null);
const isSaving = ref(false);
const eventForm = ref({
  title: '',
  date: '',
  startTime: '',
  endTime: '',
  location: '',
  description: '',
  reminder: 'none',
  recurrence: 'none'
});
const eventErrors = ref({
  title: '',
  date: ''
});

// 从store获取状态
const messages = computed(() => chatStore.messages);
const isTyping = computed(() => chatStore.isTyping);
const chatHistory = computed(() => chatStore.conversations);
const currentChatId = computed(() => chatStore.currentConversationId);

// 当前模型
const currentModel = computed({
  get: () => chatStore.currentModel,
  set: (val) => chatStore.setCurrentModel(val)
});

// 可用模型列表
const availableModels = computed(() => chatStore.getAvailableModels());

// 用户信息 - 从 userProfileStore 获取昵称
const userName = computed(() => userProfile.nickname || '用户');
const userInitials = computed(() => {
  const name = userName.value;
  return name.charAt(0).toUpperCase();
});

// 事件表单验证
const isEventValid = computed(() => {
  return eventForm.value.title.trim() !== '' && eventForm.value.date !== '';
});

/**
 * 打开事件对话框
 */
const openEventDialog = () => {
  resetEventForm();
  const today = new Date();
  eventForm.value.date = today.toISOString().split('T')[0];
  showEventDialog.value = true;
};

/**
 * 关闭事件对话框
 */
const closeEventDialog = () => {
  showEventDialog.value = false;
  resetEventForm();
};

/**
 * 重置事件表单
 */
const resetEventForm = () => {
  eventForm.value = {
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    description: '',
    reminder: 'none',
    recurrence: 'none'
  };
  eventErrors.value = {
    title: '',
    date: ''
  };
  isEditingEvent.value = false;
  editingEventId.value = null;
};

/**
 * 验证事件表单
 * @returns {boolean} 验证是否通过
 */
const validateEventForm = () => {
  let isValid = true;
  eventErrors.value = { title: '', date: '' };

  if (!eventForm.value.title.trim()) {
    eventErrors.value.title = '请输入事件标题';
    isValid = false;
  }

  if (!eventForm.value.date) {
    eventErrors.value.date = '请选择日期';
    isValid = false;
  }

  return isValid;
};

/**
 * 保存事件
 */
const saveEvent = async () => {
  if (!validateEventForm()) return;

  isSaving.value = true;

  try {
    const startDate = eventForm.value.date;
    const startTime = eventForm.value.startTime || '00:00';
    const endTime = eventForm.value.endTime || '23:59';

    const eventData = {
      title: eventForm.value.title.trim(),
      startDate: `${startDate}T${startTime}:00`,
      endDate: `${eventForm.value.date}T${endTime}:00`,
      location: eventForm.value.location.trim(),
      description: eventForm.value.description.trim(),
      reminder: eventForm.value.reminder,
      recurrence: eventForm.value.recurrence,
      color: '#667eea'
    };

    if (isEditingEvent.value && editingEventId.value) {
      eventsStore.updateEvent(editingEventId.value, eventData);
    } else {
      eventsStore.addEvent(eventData);
    }

    closeEventDialog();
  } catch (err) {
    error.value = '保存日程失败，请重试';
    setTimeout(() => { error.value = null; }, 3000);
  } finally {
    isSaving.value = false;
  }
};

/**
 * 编辑事件
 * @param {Object} event - 要编辑的事件
 */
const editEvent = (event) => {
  isEditingEvent.value = true;
  editingEventId.value = event.id;

  const startDate = new Date(event.startDate);
  const endDate = event.endDate ? new Date(event.endDate) : null;

  eventForm.value = {
    title: event.title || '',
    date: startDate.toISOString().split('T')[0],
    startTime: startDate.toTimeString().slice(0, 5),
    endTime: endDate ? endDate.toTimeString().slice(0, 5) : '',
    location: event.location || '',
    description: event.description || '',
    reminder: event.reminder || 'none',
    recurrence: event.recurrence || 'none'
  };

  showEventDialog.value = true;
};

/**
 * 滚动到底部
 */
const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

/**
 * 格式化时间
 * @param {number} timestamp - 时间戳
 * @returns {string} 格式化后的时间字符串
 */
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

/**
 * 格式化消息内容（处理代码块等）
 * @param {string} content - 消息内容
 * @returns {string} 格式化后的HTML
 */
const formatMessage = (content) => {
  if (!content) return '';

  // 转义HTML特殊字符
  let formatted = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 处理代码块
  formatted = formatted.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre class="code-block"><code>${code.trim()}</code></pre>`;
  });

  // 处理换行
  formatted = formatted.replace(/\n/g, '<br>');

  return formatted;
};

/**
 * 处理键盘事件
 * @param {KeyboardEvent} event - 键盘事件
 */
const handleKeyDown = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
};

/**
 * 自动调整输入框高度
 */
const autoResize = () => {
  const textarea = textareaRef.value;
  if (textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }
};

/**
 * 发送消息
 */
const sendMessage = async () => {
  const message = inputMessage.value.trim();
  if (!message || isTyping.value) return;

  // 添加用户消息
  chatStore.addUserMessage(message);
  inputMessage.value = '';
  autoResize();
  await scrollToBottom();

  // 发送给AI
  try {
    const response = await chatStore.getAIResponse(message, false);
    chatStore.addAssistantMessage(response.content);
    await scrollToBottom();
  } catch (err) {
    error.value = err.message;
    setTimeout(() => { error.value = null; }, 3000);
  }
};

/**
 * 发送快捷消息
 * @param {string} message - 快捷消息内容
 */
const sendQuickMessage = (message) => {
  inputMessage.value = message;
  autoResize();
  sendMessage();
};

/**
 * 切换侧边栏显示状态
 */
const toggleSidebar = () => {
  showMobileSidebar.value = !showMobileSidebar.value;
};

/**
 * 开始新对话
 */
const startNewChat = () => {
  chatStore.createConversation();
  showMobileSidebar.value = false;
  scrollToBottom();
};

/**
 * 切换对话
 * @param {string} chatId - 对话ID
 */
const switchChat = (chatId) => {
  chatStore.switchConversation(chatId);
  showMobileSidebar.value = false;
  scrollToBottom();
};

/**
 * 清空当前对话
 */
const clearChat = () => {
  if (confirm('确定要清空当前对话吗？')) {
    chatStore.clearMessages();
  }
};

/**
 * 处理模型变更
 */
const handleModelChange = () => {
  chatStore.setCurrentModel(currentModel.value);
};

/**
 * 清空所有数据
 */
const clearAllData = () => {
  if (confirm('确定要清空所有对话数据吗？此操作不可恢复。')) {
    localStorage.removeItem('chat_conversations');
    localStorage.removeItem('chat_current_conversation');
    chatStore.conversations.forEach(conv => {
      localStorage.removeItem(`chat_messages_${conv.id}`);
    });
    chatStore.createConversation();
    showSettings.value = false;
  }
};

/**
 * 组件挂载时初始化
 */
onMounted(() => {
  chatStore.loadFromLocalStorage();
  scrollToBottom();
});
</script>

<style scoped>
/* 容器样式 */
.ai-assistant-container {
  display: flex;
  height: calc(100vh - 64px);
  background: var(--bg-color, #f5f7fa);
  overflow: hidden;
}

/* CSS变量 */
:root {
  --primary-color: #667eea;
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --bg-color: #f5f7fa;
  --sidebar-bg: #ffffff;
  --chat-bg: #ffffff;
  --user-msg-bg: #667eea;
  --user-msg-color: #ffffff;
  --ai-msg-bg: #f0f2f5;
  --ai-msg-color: #333333;
  --border-color: #e1e4e8;
  --text-muted: #6b7280;
  --shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 8px 30px rgba(0, 0, 0, 0.12);
}

/* 侧边栏 */
.sidebar {
  width: 260px;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.new-chat-btn {
  width: 100%;
  padding: 12px 16px;
  background: var(--primary-gradient);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.new-chat-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.chat-history {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.history-item {
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: background 0.2s;
  margin-bottom: 4px;
}

.history-item:hover {
  background: #f3f4f6;
}

.history-item.active {
  background: #e0e7ff;
}

.history-icon {
  width: 20px;
  height: 20px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.history-text {
  flex: 1;
  font-size: 14px;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid var(--border-color);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--primary-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 12px;
  color: var(--text-muted);
}

/* 主聊天区域 */
.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--chat-bg);
  overflow: hidden;
}

/* 顶部导航栏 */
.chat-header {
  height: 60px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: white;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.menu-toggle {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  color: var(--text-muted);
}

.menu-toggle:hover {
  background: #f3f4f6;
}

.chat-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.model-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #f3f4f6;
  border-radius: 20px;
  font-size: 13px;
  color: var(--text-muted);
  cursor: pointer;
  border: none;
  outline: none;
}

.model-selector:focus {
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.3);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  transition: all 0.2s;
}

.header-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

/* 消息区域 */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.welcome-screen {
  text-align: center;
  padding: 60px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.welcome-icon {
  width: 80px;
  height: 80px;
  background: var(--primary-gradient);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  box-shadow: var(--shadow-lg);
}

.welcome-title {
  font-size: 28px;
  font-weight: 700;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-subtitle {
  font-size: 16px;
  color: var(--text-muted);
  max-width: 500px;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  max-width: 600px;
  width: 100%;
  margin-top: 20px;
}

.quick-action-btn {
  padding: 16px;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
}

.quick-action-btn:hover {
  border-color: var(--primary-color);
  box-shadow: var(--shadow);
  transform: translateY(-2px);
}

.quick-action-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.quick-action-text {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

/* 消息气泡 */
.message {
  display: flex;
  gap: 12px;
  max-width: 80%;
  animation: messageSlide 0.3s ease;
}

@keyframes messageSlide {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.message.user .message-avatar {
  background: var(--primary-gradient);
  color: white;
}

.message.ai .message-avatar {
  background: #f3f4f6;
  border: 1px solid var(--border-color);
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.6;
  word-wrap: break-word;
}

.message.user .message-bubble {
  background: var(--user-msg-bg);
  color: var(--user-msg-color);
  border-bottom-right-radius: 4px;
}

.message.ai .message-bubble {
  background: var(--ai-msg-bg);
  color: var(--ai-msg-color);
  border-bottom-left-radius: 4px;
}

.message-time {
  font-size: 11px;
  color: var(--text-muted);
  align-self: flex-end;
}

.message.user .message-time {
  align-self: flex-start;
}

/* 输入区域 */
.chat-input-container {
  padding: 20px 24px;
  border-top: 1px solid var(--border-color);
  background: white;
  flex-shrink: 0;
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  background: #f3f4f6;
  border-radius: 16px;
  padding: 8px;
  border: 1px solid transparent;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-wrapper:focus-within {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  background: white;
}

.input-actions {
  display: flex;
  gap: 4px;
  padding: 4px;
}

.input-action-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  transition: all 0.2s;
}

.input-action-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.message-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 8px;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  max-height: 120px;
  min-height: 24px;
  font-family: inherit;
  outline: none;
}

.message-input::placeholder {
  color: #9ca3af;
}

.send-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background: var(--primary-gradient);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, opacity 0.2s;
}

.send-btn:hover {
  transform: scale(1.05);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* 加载动画 */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  background: var(--ai-msg-bg);
  border-radius: 18px;
  border-bottom-left-radius: 4px;
  width: fit-content;
}

.typing-dot {
  width: 8px;
  height: 8px;
  background: var(--text-muted);
  border-radius: 50%;
  animation: typingBounce 1.4s infinite ease-in-out both;
}

.typing-dot:nth-child(1) { animation-delay: -0.32s; }
.typing-dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes typingBounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* 遮罩层 */
.overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;
}

.overlay.show {
  display: block;
}

/* 代码块样式 */
:deep(.code-block) {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  margin: 8px 0;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 400px;
  margin: 0 16px;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: var(--text-muted);
}

.modal-close:hover {
  color: #374151;
}

.setting-item {
  margin-bottom: 16px;
}

.setting-item label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.setting-item select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.setting-item select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.clear-all-btn {
  width: 100%;
  padding: 12px;
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-all-btn:hover {
  background: #fee2e2;
}

/* 事件弹窗样式 */
.event-modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  margin: 0 16px;
  box-shadow: var(--shadow-lg);
  max-height: 90vh;
  overflow-y: auto;
}

.event-field {
  margin-bottom: 16px;
}

.event-field.half {
  flex: 1;
  margin-bottom: 0;
}

.event-field-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.event-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}

.event-label .required {
  color: #ef4444;
  margin-left: 2px;
}

.event-input,
.event-select,
.event-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  background: white;
  color: #333;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.event-input:focus,
.event-select:focus,
.event-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.event-input.is-error {
  border-color: #ef4444;
}

.event-textarea {
  resize: vertical;
  min-height: 80px;
}

.error-text {
  display: block;
  font-size: 12px;
  color: #ef4444;
  margin-top: 4px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
  margin-top: 8px;
}

.btn-cancel,
.btn-save {
  flex: 1;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-save {
  background: var(--primary-gradient);
  color: white;
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.add-event-btn {
  border-color: var(--primary-color) !important;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
}

.add-event-btn:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
}

/* 错误提示 */
.error-toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #dc2626;
  color: white;
  padding: 12px 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: var(--shadow-lg);
  z-index: 101;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.error-toast button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    z-index: 100;
    transform: translateX(-100%);
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .menu-toggle {
    display: flex;
  }

  .message {
    max-width: 90%;
  }

  .chat-messages {
    padding: 16px;
  }

  .chat-input-container {
    padding: 12px 16px;
  }

  .quick-actions {
    grid-template-columns: 1fr;
  }

  .chat-header {
    padding: 0 16px;
  }

  .overlay.show {
    display: block;
  }
}

/* 滚动条样式 */
.chat-history::-webkit-scrollbar,
.chat-messages::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.chat-history::-webkit-scrollbar-track,
.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-history::-webkit-scrollbar-thumb,
.chat-messages::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.chat-history::-webkit-scrollbar-thumb:hover,
.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  .message {
    animation: none;
  }

  .typing-dot {
    animation: none;
  }
}
</style>
