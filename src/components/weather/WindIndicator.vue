<!--
  风向风速指示器组件
  展示风向、风速和风力等级
-->
<template>
  <div class="wind-indicator">
    <div class="wind-header">
      <h4 class="wind-title">💨 风向风速</h4>
    </div>
    
    <div class="wind-content">
      <!-- 风向罗盘 -->
      <div class="compass-container">
        <div class="compass">
          <!-- 方向标记 -->
          <div class="direction-mark n">N</div>
          <div class="direction-mark s">S</div>
          <div class="direction-mark e">E</div>
          <div class="direction-mark w">W</div>
          
          <!-- 风向指针 -->
          <div
            class="wind-arrow"
            :style="{ transform: `rotate(${windDirectionAngle}deg)` }"
          >
            <div class="arrow-head"></div>
            <div class="arrow-tail"></div>
          </div>
          
          <!-- 中心点 -->
          <div class="compass-center"></div>
        </div>
        
        <!-- 风向文字 -->
        <div class="wind-direction-text">
          {{ windDirectionName }}
        </div>
      </div>
      
      <!-- 风速信息 -->
      <div class="wind-info">
        <div class="wind-speed-section">
          <div class="speed-value">{{ windSpeed }}</div>
          <div class="speed-unit">km/h</div>
        </div>
        
        <div class="wind-level-section">
          <div class="level-label">风力等级</div>
          <div class="level-value">{{ windPower }}</div>
        </div>
        
        <div class="wind-desc">
          {{ windDescription }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

/**
 * 组件属性定义
 */
const props = defineProps({
  windDirection: {
    type: String,
    default: '东风'
  },
  windSpeed: {
    type: Number,
    default: 15
  },
  windPower: {
    type: String,
    default: '3级'
  }
});

/**
 * 风向角度映射
 */
const DIRECTION_ANGLES = {
  '北风': 0,
  '北东北风': 22.5,
  '东北风': 45,
  '东东北风': 67.5,
  '东风': 90,
  '东东南风': 112.5,
  '东南风': 135,
  '南东南风': 157.5,
  '南风': 180,
  '南西南风': 202.5,
  '西南风': 225,
  '西西南风': 247.5,
  '西风': 270,
  '西西北风': 292.5,
  '西北风': 315,
  '北西北风': 337.5
};

/**
 * 计算风向角度
 */
const windDirectionAngle = computed(() => {
  // 风向是风吹来的方向，指针应该指向风吹来的方向
  return DIRECTION_ANGLES[props.windDirection] || 90;
});

/**
 * 风向名称
 */
const windDirectionName = computed(() => {
  return props.windDirection || '东风';
});

/**
 * 风速描述
 */
const windDescription = computed(() => {
  const speed = props.windSpeed;
  if (speed < 5) return '微风拂面，舒适宜人';
  if (speed < 15) return '轻风徐来，适合出行';
  if (speed < 25) return '清风阵阵，注意防风';
  if (speed < 35) return '风力较强，注意安全';
  return '大风天气，避免外出';
});
</script>

<style scoped>
.wind-indicator {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.wind-header {
  margin-bottom: 16px;
}

.wind-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.wind-content {
  display: flex;
  align-items: center;
  gap: 24px;
}

/* 罗盘容器 */
.compass-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.compass {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 3px solid #e5e7eb;
  position: relative;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
}

/* 方向标记 */
.direction-mark {
  position: absolute;
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
}

.direction-mark.n {
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  color: #ef4444;
}

.direction-mark.s {
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
}

.direction-mark.e {
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
}

.direction-mark.w {
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
}

/* 风向指针 */
.wind-arrow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 50px;
  margin-left: -2px;
  margin-top: -25px;
  transform-origin: center center;
  transition: transform 0.5s ease;
}

.arrow-head {
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 20px solid #3b82f6;
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
}

.arrow-tail {
  width: 4px;
  height: 30px;
  background: #6b7280;
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
}

/* 中心点 */
.compass-center {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 12px;
  height: 12px;
  background: #3b82f6;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 风向文字 */
.wind-direction-text {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

/* 风速信息 */
.wind-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wind-speed-section {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.speed-value {
  font-size: 36px;
  font-weight: 700;
  color: #3b82f6;
  line-height: 1;
}

.speed-unit {
  font-size: 14px;
  color: #6b7280;
}

.wind-level-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.level-label {
  font-size: 12px;
  color: #6b7280;
}

.level-value {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 4px;
}

.wind-desc {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .wind-content {
    flex-direction: column;
    text-align: center;
  }
  
  .wind-info {
    align-items: center;
  }
}
</style>
