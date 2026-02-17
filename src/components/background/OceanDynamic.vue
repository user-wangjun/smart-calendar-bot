<template>
  <div class="ocean-background">
    <div class="ocean-bg-image"></div>
    <div class="ocean-overlay"></div>
    <div class="waves-layer">
      <div v-for="wave in waves" :key="wave.id" class="wave" :style="wave.style"></div>
    </div>
    <div class="bubbles-layer">
      <div v-for="bubble in bubbles" :key="bubble.id" class="bubble" :style="bubble.style"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onActivated, watch, onUnmounted, nextTick } from 'vue';

const props = defineProps({
  waveCount: {
    type: Number,
    default: 5
  },
  bubbleCount: {
    type: Number,
    default: 20
  }
});

const waves = ref([]);
const bubbles = ref([]);
let bubbleInterval = null;

/**
 * 生成波浪数据
 * 使用唯一ID确保动画重新触发
 */
const generateWaves = () => {
  const newWaves = [];
  for (let i = 0; i < props.waveCount; i++) {
    newWaves.push({
      id: `wave-${Date.now()}-${i}`,
      style: {
        animationDelay: `${i * 2}s`,
        animationDuration: `${6 + i * 2}s`
      }
    });
  }
  waves.value = newWaves;
};

/**
 * 生成气泡数据
 * 使用唯一ID确保每次都有新动画
 */
const generateBubbles = () => {
  const newBubbles = [];
  for (let i = 0; i < props.bubbleCount; i++) {
    const size = Math.random() * 20 + 5;
    newBubbles.push({
      id: `bubble-${Date.now()}-${i}`,
      style: {
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 8}s`,
        animationDuration: `${5 + Math.random() * 5}s`,
        width: `${size}px`,
        height: `${size}px`
      }
    });
  }
  bubbles.value = newBubbles;
};

/**
 * 定期更新气泡，增强动态效果
 */
const startBubbleRefresh = () => {
  if (bubbleInterval) {
    clearInterval(bubbleInterval);
  }
  bubbleInterval = setInterval(() => {
    generateBubbles();
  }, 10000);
};

/**
 * 停止气泡刷新定时器
 */
const stopBubbleRefresh = () => {
  if (bubbleInterval) {
    clearInterval(bubbleInterval);
    bubbleInterval = null;
  }
};

/**
 * 初始化组件
 * 确保每次激活都能重新渲染
 */
const initialize = () => {
  nextTick(() => {
    generateWaves();
    generateBubbles();
    startBubbleRefresh();
  });
};

/**
 * 重新渲染所有动画
 * 用于背景切换后强制动画重新开始
 */
const reinitialize = () => {
  waves.value = [];
  bubbles.value = [];
  nextTick(() => {
    initialize();
  });
};

/**
 * 暴露重新初始化方法给父组件
 */
defineExpose({
  reinitialize
});

onMounted(() => {
  initialize();
});

onActivated(() => {
  initialize();
});

/**
 * 监听波浪数量变化
 */
watch(() => props.waveCount, () => {
  generateWaves();
});

/**
 * 监听气泡数量变化
 */
watch(() => props.bubbleCount, () => {
  generateBubbles();
});

onUnmounted(() => {
  stopBubbleRefresh();
});
</script>

<style scoped>
.ocean-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #0a1628;
  overflow: hidden;
  z-index: -1;
  pointer-events: none;
}

.ocean-bg-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1920&q=85');
  background-size: cover;
  background-position: center;
  opacity: 0.7;
  animation: ocean-sway 20s ease-in-out infinite;
}

@keyframes ocean-sway {
  0%, 100% { transform: scale(1) translate(0, 0); }
  50% { transform: scale(1.05) translate(-10px, -5px); }
}

.ocean-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(ellipse at 50% 70%, transparent 0%, transparent 40%, rgba(10, 22, 40, 0.3) 80%),
    linear-gradient(180deg, rgba(0, 20, 40, 0.4) 0%, transparent 30%, transparent 70%, rgba(0, 20, 40, 0.5) 100%);
  pointer-events: none;
}

.waves-layer {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.wave {
  position: absolute;
  bottom: 0;
  left: -10%;
  width: 120%;
  height: 150px;
  background: linear-gradient(180deg, transparent, rgba(100, 180, 255, 0.15) 0%, rgba(60, 140, 220, 0.2) 50%, rgba(40, 100, 180, 0.25) 100%);
  border-radius: 100% 100% 0 0;
  animation: wave-move 8s ease-in-out infinite;
  opacity: 0.6;
  will-change: transform;
}

@keyframes wave-move {
  0%, 100% { transform: translateX(0) scaleY(1); }
  50% { transform: translateX(30px) scaleY(1.1); }
}

.bubbles-layer {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.bubble {
  position: absolute;
  bottom: -30px;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8), rgba(150, 200, 255, 0.4), transparent);
  border-radius: 50%;
  animation: bubble-rise 8s ease-in-out infinite;
  will-change: transform, opacity;
}

@keyframes bubble-rise {
  0% {
    transform: translateY(0) scale(1);
    opacity: 0;
  }
  10% {
    opacity: 0.8;
  }
  90% {
    opacity: 0.6;
  }
  100% {
    transform: translateY(-100vh) scale(1.5);
    opacity: 0;
  }
}

@media (max-width: 768px) {
  .wave {
    height: 100px;
  }
}
</style>
