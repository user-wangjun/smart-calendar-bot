<template>
  <div class="not-found-page">
    <div class="error-container">
      <div class="error-icon">🤔</div>
      <h1 class="error-title">页面未找到</h1>
      <p class="error-message">
        抱歉，您访问的页面不存在或已被移动。
      </p>
      <div class="error-actions">
        <button class="btn-primary" @click="goHome">
          🏠 返回首页
        </button>
        <button class="btn-secondary" @click="goBack">
          🔙 返回上一页
        </button>
      </div>
      <div class="error-details">
        <p class="error-code">错误代码: 404</p>
        <p class="error-path">当前路径: {{ currentPath }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

// 路由
const router = useRouter();
const route = useRoute();

// 计算属性
const currentPath = computed(() => route.path);

// 方法
const goHome = () => {
  router.push('/');
};

const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1);
  } else {
    router.push('/');
  }
};
</script>

<style scoped>
.not-found-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.error-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  padding: 48px;
  text-align: center;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.error-icon {
  font-size: 80px;
  margin-bottom: 24px;
  animation: bounce 2s infinite;
}

.error-title {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 16px 0;
}

.error-message {
  font-size: 16px;
  color: #6b7280;
  line-height: 1.6;
  margin: 0 0 32px 0;
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.8);
  color: #374151;
  border: 2px solid #e5e7eb;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 1);
  border-color: #d1d5db;
  transform: translateY(-2px);
}

.error-details {
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.error-code,
.error-path {
  font-size: 12px;
  color: #9ca3af;
  margin: 4px 0;
}

.error-path {
  font-family: 'Courier New', monospace;
  background-color: #f3f4f6;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
  word-break: break-all;
}

/* 动画 */
@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .error-container {
    padding: 32px 24px;
    margin: 16px;
  }
  
  .error-icon {
    font-size: 60px;
  }
  
  .error-title {
    font-size: 24px;
  }
  
  .error-message {
    font-size: 14px;
  }
  
  .error-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .not-found-page {
    padding: 16px;
  }
  
  .error-container {
    padding: 24px 16px;
  }
  
  .error-icon {
    font-size: 48px;
  }
  
  .error-title {
    font-size: 20px;
  }
  
  .error-message {
    font-size: 13px;
  }
}
</style>