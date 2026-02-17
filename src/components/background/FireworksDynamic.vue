<template>
  <div class="fireworks-background">
    <div class="fireworks-bg-image"></div>
    <div class="fireworks-overlay"></div>
    <div class="fireworks-layer">
      <div v-for="firework in fireworks" :key="firework.id" class="firework" :style="firework.style">
        <div v-for="particle in getParticles(firework)" :key="particle.id" class="particle" :style="particle.style"></div>
      </div>
    </div>
    <div class="city-lights">
      <div v-for="light in cityLights" :key="light.id" class="city-light" :style="light.style"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onActivated, watch, onUnmounted, nextTick } from 'vue';

const props = defineProps({
  fireworkCount: {
    type: Number,
    default: 8
  },
  particleCount: {
    type: Number,
    default: 12
  }
});

const fireworks = ref([]);
const cityLights = ref([]);
let fireworkInterval = null;

/**
 * 生成烟花数据
 * 使用唯一ID确保每次都是新动画
 */
const generateFireworks = () => {
  const newFireworks = [];
  const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#1dd1a1'];
  for (let i = 0; i < props.fireworkCount; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    newFireworks.push({
      id: `firework-${Date.now()}-${i}`,
      color,
      style: {
        left: `${10 + Math.random() * 80}%`,
        top: `${10 + Math.random() * 50}%`,
        animationDelay: `${i * 2.5}s`
      }
    });
  }
  fireworks.value = newFireworks;
};

/**
 * 生成烟花粒子
 * 为每个烟花创建独立的粒子效果
 */
const getParticles = (firework) => {
  const particles = [];
  for (let i = 0; i < props.particleCount; i++) {
    const angle = (i / props.particleCount) * Math.PI * 2;
    const distance = 50 + Math.random() * 100;
    particles.push({
      id: `${firework.id}-particle-${i}`,
      style: {
        background: firework.color,
        '--tx': `${Math.cos(angle) * distance}px`,
        '--ty': `${Math.sin(angle) * distance}px`,
        animationDelay: `${firework.style.animationDelay}`
      }
    });
  }
  return particles;
};

/**
 * 生成城市灯光数据
 */
const generateCityLights = () => {
  const newLights = [];
  for (let i = 0; i < 50; i++) {
    newLights.push({
      id: `light-${Date.now()}-${i}`,
      style: {
        left: `${Math.random() * 100}%`,
        bottom: `${10 + Math.random() * 30}%`,
        animationDelay: `${Math.random() * 2}s`
      }
    });
  }
  cityLights.value = newLights;
};

/**
 * 定期更新烟花，增强动态效果
 */
const startFireworkRefresh = () => {
  if (fireworkInterval) {
    clearInterval(fireworkInterval);
  }
  fireworkInterval = setInterval(() => {
    generateFireworks();
  }, 20000);
};

/**
 * 停止烟花刷新定时器
 */
const stopFireworkRefresh = () => {
  if (fireworkInterval) {
    clearInterval(fireworkInterval);
    fireworkInterval = null;
  }
};

/**
 * 初始化组件
 * 确保每次激活都能重新渲染
 */
const initialize = () => {
  nextTick(() => {
    generateFireworks();
    generateCityLights();
    startFireworkRefresh();
  });
};

/**
 * 重新渲染所有动画
 * 用于背景切换后强制动画重新开始
 */
const reinitialize = () => {
  fireworks.value = [];
  cityLights.value = [];
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
 * 监听烟花数量变化
 */
watch(() => props.fireworkCount, () => {
  generateFireworks();
});

/**
 * 监听粒子数量变化
 */
watch(() => props.particleCount, () => {
  generateFireworks();
});

onUnmounted(() => {
  stopFireworkRefresh();
});
</script>

<style scoped>
.fireworks-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #0a0a1a 0%, #1a1a3a 50%, #0f1c2e 100%);
  overflow: hidden;
  z-index: -1;
  pointer-events: none;
}

.fireworks-bg-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1920&q=85');
  background-size: cover;
  background-position: center;
  opacity: 0.3;
  filter: brightness(0.8);
}

.fireworks-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(ellipse at 50% 30%, transparent 0%, transparent 40%, rgba(10, 10, 26, 0.4) 80%),
    linear-gradient(180deg, rgba(10, 10, 26, 0.6) 0%, transparent 20%, transparent 80%, rgba(10, 10, 26, 0.7) 100%);
  pointer-events: none;
}

.fireworks-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.firework {
  position: absolute;
  animation: firework-explode 4s ease-out infinite;
  will-change: transform, opacity;
}

@keyframes firework-explode {
  0%, 100% {
    opacity: 0;
    transform: scale(0);
  }
  10% {
    opacity: 1;
    transform: scale(1);
  }
  90% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.particle {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  left: 0;
  top: 0;
  animation: particle-fly 3s ease-out infinite;
  box-shadow: 0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor;
  will-change: transform, opacity;
}

@keyframes particle-fly {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(var(--tx), var(--ty)) scale(0);
    opacity: 0;
  }
}

.city-lights {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 50%;
}

.city-light {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  animation: light-blink 2s ease-in-out infinite;
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.6);
  will-change: opacity;
}

@keyframes light-blink {
  0%, 100% {
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .particle {
    width: 6px;
    height: 6px;
  }
}
</style>
