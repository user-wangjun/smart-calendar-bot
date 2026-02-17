<template>
  <div class="starry-background">
    <div class="galaxy-bg-image"></div>
    <div class="galaxy-overlay"></div>
    <div class="spiral-glow"></div>
    <div class="galaxy-core-glow"></div>
    <div class="spiral-arm spiral-arm-1"></div>
    <div class="spiral-arm spiral-arm-2"></div>
    <div class="stars-layer">
      <div v-for="star in stars" :key="star.id" class="star" :style="star.style"></div>
    </div>
    <div class="shooting-stars-layer">
      <div v-for="meteor in shootingStars" :key="meteor.id" class="shooting-star" :style="meteor.style"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onActivated, watch, onUnmounted, nextTick } from 'vue';

const props = defineProps({
  starCount: {
    type: Number,
    default: 50
  },
  meteorCount: {
    type: Number,
    default: 3
  }
});

const stars = ref([]);
const shootingStars = ref([]);
let starInterval = null;

/**
 * 生成随机星星
 * 使用唯一ID确保动画重新触发
 */
const generateStars = () => {
  const newStars = [];
  for (let i = 0; i < props.starCount; i++) {
    const size = Math.random() * 3 + 1;
    newStars.push({
      id: `star-${Date.now()}-${i}`,
      style: {
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        width: `${size}px`,
        height: `${size}px`,
        animationDelay: `${Math.random() * 4}s`,
        animationDuration: `${3 + Math.random() * 3}s`
      }
    });
  }
  stars.value = newStars;
};

/**
 * 生成流星
 * 使用唯一ID确保动画重新触发
 */
const generateShootingStars = () => {
  const newMeteors = [];
  for (let i = 0; i < props.meteorCount; i++) {
    newMeteors.push({
      id: `meteor-${Date.now()}-${i}`,
      style: {
        top: `${Math.random() * 50}%`,
        left: `${Math.random() * 100}%`,
        animationDelay: `${i * 3 + Math.random() * 2}s`,
        animationDuration: `${3 + Math.random() * 2}s`
      }
    });
  }
  shootingStars.value = newMeteors;
};

/**
 * 定期更新流星，增强动态效果
 */
const startMeteorRefresh = () => {
  if (starInterval) {
    clearInterval(starInterval);
  }
  starInterval = setInterval(() => {
    generateShootingStars();
  }, 15000);
};

/**
 * 停止流星刷新定时器
 */
const stopMeteorRefresh = () => {
  if (starInterval) {
    clearInterval(starInterval);
    starInterval = null;
  }
};

/**
 * 初始化组件
 * 确保每次激活都能重新渲染
 */
const initialize = () => {
  nextTick(() => {
    generateStars();
    generateShootingStars();
    startMeteorRefresh();
  });
};

/**
 * 重新渲染所有动画
 * 用于背景切换后强制动画重新开始
 */
const reinitialize = () => {
  stars.value = [];
  shootingStars.value = [];
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
 * 监听星星数量变化
 */
watch(() => props.starCount, () => {
  generateStars();
});

/**
 * 监听流星数量变化
 */
watch(() => props.meteorCount, () => {
  generateShootingStars();
});

onUnmounted(() => {
  stopMeteorRefresh();
});
</script>

<style scoped>
.starry-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000000;
  overflow: hidden;
  z-index: -1;
  pointer-events: none;
}

.galaxy-bg-image {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 130%;
  height: 130%;
  transform: translate(-50%, -50%) rotate(0deg);
  background-image: url('https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=1920&q=85');
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.95;
  animation: galaxy-slow-rotate 400s linear infinite;
}

@keyframes galaxy-slow-rotate {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

.galaxy-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(ellipse 85% 60% at 50% 50%, transparent 0%, transparent 60%, rgba(0, 0, 0, 0.3) 100%),
    linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, transparent 20%, transparent 80%, rgba(0, 0, 0, 0.2) 100%);
  pointer-events: none;
}

.spiral-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1000px;
  height: 600px;
  transform: translate(-50%, -50%);
  background:
    radial-gradient(ellipse 50% 30% at 50% 50%, rgba(255, 240, 220, 0.9) 0%, transparent 40%),
    radial-gradient(ellipse 80% 50% at 50% 50%, rgba(180, 200, 255, 0.6) 0%, transparent 55%),
    radial-gradient(ellipse 100% 60% at 50% 50%, rgba(150, 180, 220, 0.4) 0%, transparent 70%);
  filter: blur(50px);
  animation: spiral-pulse 12s ease-in-out infinite;
  will-change: transform, filter, opacity;
}

@keyframes spiral-pulse {
  0%, 100% {
    opacity: 0.85;
    transform: translate(-50%, -50%) scale(1);
    filter: blur(50px) brightness(1);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.08);
    filter: blur(50px) brightness(1.2);
  }
}

.galaxy-core-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 350px;
  height: 180px;
  transform: translate(-50%, -50%);
  background: radial-gradient(ellipse 55% 35% at 50% 50%,
    rgba(255, 250, 240, 1) 0%,
    rgba(255, 240, 220, 0.95) 10%,
    rgba(255, 230, 200, 0.8) 25%,
    rgba(220, 200, 255, 0.6) 40%,
    transparent 60%);
  filter: blur(25px);
  animation: core-glow-pulse 6s ease-in-out infinite;
  will-change: transform, filter, opacity;
}

@keyframes core-glow-pulse {
  0%, 100% {
    opacity: 0.9;
    transform: translate(-50%, -50%) scale(1);
    filter: blur(25px) brightness(1);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.15);
    filter: blur(25px) brightness(1.25);
  }
}

.spiral-arm {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 800px;
  height: 400px;
  transform-origin: center center;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(200, 220, 255, 0.3) 20%,
    rgba(255, 240, 220, 0.5) 50%,
    rgba(200, 220, 255, 0.3) 80%,
    transparent 100%);
  filter: blur(20px);
  border-radius: 50%;
}

.spiral-arm-1 {
  transform: translate(-50%, -50%) rotate(-30deg) scaleX(1.2);
  animation: arm-pulse-1 15s ease-in-out infinite;
  will-change: transform, filter, opacity;
}

.spiral-arm-2 {
  transform: translate(-50%, -50%) rotate(30deg) scaleX(1.2);
  animation: arm-pulse-2 15s ease-in-out infinite;
  will-change: transform, filter, opacity;
}

@keyframes arm-pulse-1 {
  0%, 100% {
    opacity: 0.5;
    transform: translate(-50%, -50%) rotate(-30deg) scaleX(1.2);
    filter: blur(20px) brightness(1);
  }
  50% {
    opacity: 0.9;
    transform: translate(-50%, -50%) rotate(-30deg) scaleX(1.35);
    filter: blur(20px) brightness(1.25);
  }
}

@keyframes arm-pulse-2 {
  0%, 100% {
    opacity: 0.5;
    transform: translate(-50%, -50%) rotate(30deg) scaleX(1.2);
    filter: blur(20px) brightness(1);
  }
  50% {
    opacity: 0.9;
    transform: translate(-50%, -50%) rotate(30deg) scaleX(1.35);
    filter: blur(20px) brightness(1.25);
  }
}

.stars-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.star {
  position: absolute;
  background: white;
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.9), 0 0 12px rgba(255, 255, 255, 0.5);
  animation: twinkle 4s infinite ease-in-out;
  will-change: transform, opacity;
}

@keyframes twinkle {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.4); }
}

.shooting-stars-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.shooting-star {
  position: absolute;
  width: 150px;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.9), rgba(200, 220, 255, 0.6), transparent);
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.8);
  animation: shoot 4s linear infinite;
  opacity: 0;
  will-change: transform, opacity;
}

@keyframes shoot {
  0% {
    transform: translateX(-150px) translateY(0) rotate(-35deg);
    opacity: 1;
  }
  100% {
    transform: translateX(400px) translateY(280px) rotate(-35deg);
    opacity: 0;
  }
}

@media (max-width: 768px) {
  .spiral-glow {
    width: 500px;
    height: 300px;
  }
  
  .galaxy-core-glow {
    width: 200px;
    height: 100px;
  }
  
  .spiral-arm {
    width: 400px;
    height: 200px;
  }
}
</style>
