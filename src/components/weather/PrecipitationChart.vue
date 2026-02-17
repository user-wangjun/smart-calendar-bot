<!--
  降水概率图表组件
  展示未来7天降水概率曲线
-->
<template>
  <div class="precipitation-chart">
    <div class="chart-header">
      <h4 class="chart-title">🌧️ 7天降水概率</h4>
      <div class="chart-legend">
        <span class="legend-item">
          <span class="legend-color precip-line"></span>
          降水概率
        </span>
      </div>
    </div>
    
    <div
      class="chart-container"
      ref="chartContainer"
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave"
    >
      <svg :viewBox="`0 0 ${width} ${height}`" class="chart-svg">
        <!-- 定义渐变 -->
        <defs>
          <linearGradient id="precipGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.8" />
            <stop offset="100%" style="stop-color:#60a5fa;stop-opacity:0.2" />
          </linearGradient>
        </defs>
        
        <!-- 网格线 -->
        <g class="grid-lines">
          <line
            v-for="(line, index) in gridLines"
            :key="`h-${index}`"
            :x1="padding.left"
            :y1="line.y"
            :x2="width - padding.right"
            :y2="line.y"
            class="grid-line"
          />
        </g>
        
        <!-- 降水概率柱状图 -->
        <g class="bars">
          <rect
            v-for="(bar, index) in bars"
            :key="`bar-${index}`"
            :x="bar.x"
            :y="bar.y"
            :width="bar.width"
            :height="bar.height"
            :fill="bar.color"
            :rx="4"
            class="bar"
            @mouseenter="handleMouseEnter(index)"
            @mouseleave="handleMouseLeave"
          />
        </g>
        
        <!-- 降水概率折线 -->
        <path
          :d="precipitationPath"
          class="precip-line"
          fill="none"
        />
        
        <!-- 数据点 -->
        <g class="data-points">
          <circle
            v-for="(point, index) in dataPoints"
            :key="`point-${index}`"
            :cx="point.x"
            :cy="point.y"
            :r="hoveredIndex === index ? 6 : 4"
            class="data-point"
            @mouseenter="handleMouseEnter(index)"
            @mouseleave="handleMouseLeave"
          />
        </g>
        
        <!-- X轴标签 -->
        <g class="x-labels">
          <text
            v-for="(label, index) in xLabels"
            :key="`x-${index}`"
            :x="label.x"
            :y="height - padding.bottom + 20"
            class="axis-label"
            text-anchor="middle"
          >
            {{ label.text }}
          </text>
        </g>
        
        <!-- Y轴标签 -->
        <g class="y-labels">
          <text
            v-for="(label, index) in yLabels"
            :key="`y-${index}`"
            :x="padding.left - 10"
            :y="label.y + 4"
            class="axis-label"
            text-anchor="end"
          >
            {{ label.text }}%
          </text>
        </g>

        <!-- 降水概率数值标签 -->
        <g class="value-labels">
          <text
            v-for="(bar, index) in bars"
            :key="`val-${index}`"
            :x="bar.x + bar.width / 2"
            :y="bar.y - 5"
            class="value-label"
            text-anchor="middle"
          >
            {{ bar.data.precipitationProbability }}%
          </text>
        </g>

        <!-- 十字准星 -->
        <g v-if="crosshairPosition" class="crosshair-group">
          <line
            :x1="crosshairPosition.x"
            :y1="crosshairPosition.y1"
            :x2="crosshairPosition.x"
            :y2="crosshairPosition.y2"
            class="crosshair"
          />
        </g>
      </svg>
      
      <!-- 悬停提示 -->
      <div
        v-if="hoveredIndex !== null && tooltipVisible"
        class="chart-tooltip"
        :style="tooltipStyle"
      >
        <div class="tooltip-date">{{ dailyData[hoveredIndex]?.displayDate }}</div>
        <div class="tooltip-precip">降水概率: {{ dailyData[hoveredIndex]?.precipitationProbability }}%</div>
        <div class="tooltip-weather">{{ dailyData[hoveredIndex]?.weather }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

/**
 * 组件属性定义
 */
const props = defineProps({
  dailyData: {
    type: Array,
    default: () => []
  }
});

/**
 * 图表尺寸配置
 */
const width = ref(800);
const height = ref(250);
const padding = { top: 40, right: 40, bottom: 60, left: 50 };

/**
 * 悬停状态
 */
const hoveredIndex = ref(null);
const tooltipVisible = ref(false);
const tooltipStyle = ref({});
const chartContainer = ref(null);

/**
 * 计算图表实际绘制区域
 */
const chartWidth = computed(() => width.value - padding.left - padding.right);
const chartHeight = computed(() => height.value - padding.top - padding.bottom);

/**
 * 计算柱状图数据
 */
const bars = computed(() => {
  if (!props.dailyData || !Array.isArray(props.dailyData) || props.dailyData.length === 0) return [];

  const data = props.dailyData;
  const barWidth = chartWidth.value / data.length * 0.6;
  const stepX = chartWidth.value / data.length;
  
  return data.map((item, index) => {
    const barHeight = (item.precipitationProbability / 100) * chartHeight.value;
    const x = padding.left + index * stepX + (stepX - barWidth) / 2;
    const y = padding.top + chartHeight.value - barHeight;
    
    // 根据降水概率设置颜色
    let color = '#e5e7eb';
    if (item.precipitationProbability > 0) {
      const opacity = 0.3 + (item.precipitationProbability / 100) * 0.7;
      color = `rgba(59, 130, 246, ${opacity})`;
    }
    
    return {
      x,
      y,
      width: barWidth,
      height: barHeight,
      color,
      data: item
    };
  });
});

/**
 * 计算数据点坐标
 */
const dataPoints = computed(() => {
  if (!props.dailyData || !Array.isArray(props.dailyData) || props.dailyData.length === 0) return [];

  const data = props.dailyData;
  const stepX = chartWidth.value / data.length;
  
  return data.map((item, index) => ({
    x: padding.left + index * stepX + stepX / 2,
    y: padding.top + chartHeight.value - (item.precipitationProbability / 100) * chartHeight.value,
    data: item
  }));
});

/**
 * 生成折线路径
 */
const precipitationPath = computed(() => {
  if (dataPoints.value.length === 0) return '';
  
  const points = dataPoints.value;
  let path = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    
    // 使用简单的直线连接
    path += ` L ${next.x} ${next.y}`;
  }
  
  return path;
});

/**
 * 生成网格线
 */
const gridLines = computed(() => {
  const lines = [];
  const count = 5;
  for (let i = 0; i <= count; i++) {
    const y = padding.top + (chartHeight.value / count) * i;
    lines.push({ y });
  }
  return lines;
});

/**
 * X轴标签
 */
const xLabels = computed(() => {
  if (!props.dailyData || !Array.isArray(props.dailyData) || props.dailyData.length === 0) return [];

  const labels = [];
  const stepX = chartWidth.value / props.dailyData.length;
  
  props.dailyData.forEach((item, index) => {
    labels.push({
      x: padding.left + index * stepX + stepX / 2,
      text: item.displayDate
    });
  });
  
  return labels;
});

/**
 * Y轴标签
 */
const yLabels = computed(() => {
  const labels = [];
  const count = 5;
  
  for (let i = 0; i <= count; i++) {
    const y = padding.top + (chartHeight.value / count) * i;
    const percent = 100 - (100 / count) * i;
    labels.push({
      y,
      text: Math.round(percent)
    });
  }
  
  return labels;
});

/**
 * 处理鼠标进入
 */
const handleMouseEnter = (index) => {
  hoveredIndex.value = index;
  tooltipVisible.value = true;
  
  const point = dataPoints.value[index];
  if (point && chartContainer.value) {
    tooltipStyle.value = {
      left: `${point.x}px`,
      top: `${point.y - 70}px`
    };
  }
};

/**
 * 处理鼠标离开
 */
const handleMouseLeave = () => {
  hoveredIndex.value = null;
  tooltipVisible.value = false;
};

/**
 * 处理鼠标移动（用于十字准星）
 */
const handleMouseMove = (event) => {
  if (!chartContainer.value || !props.dailyData || props.dailyData.length === 0) return;

  const rect = chartContainer.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const chartW = width.value - padding.left - padding.right;

  // 计算最近的数据点索引
  const stepX = chartW / props.dailyData.length;
  let index = Math.floor((x - padding.left) / stepX);
  index = Math.max(0, Math.min(index, props.dailyData.length - 1));

  if (hoveredIndex.value !== index) {
    hoveredIndex.value = index;
    tooltipVisible.value = true;

    const point = dataPoints.value[index];
    if (point) {
      tooltipStyle.value = {
        left: `${point.x}px`,
        top: `${point.y - 70}px`
      };
    }
  }
};

/**
 * 十字准星位置
 */
const crosshairPosition = computed(() => {
  if (hoveredIndex.value === null || !dataPoints.value[hoveredIndex.value]) return null;
  const point = dataPoints.value[hoveredIndex.value];
  return {
    x: point.x,
    y1: padding.top,
    y2: height.value - padding.bottom
  };
});

/**
 * 防抖函数
 */
const debounce = (fn, delay) => {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
};

/**
 * 响应式调整图表大小
 */
const handleResize = () => {
  if (chartContainer.value) {
    const rect = chartContainer.value.getBoundingClientRect();
    width.value = Math.max(600, rect.width);
  }
};

/**
 * 防抖后的resize处理
 */
const debouncedResize = debounce(handleResize, 200);

/**
 * 组件挂载时初始化
 */
onMounted(() => {
  handleResize();
  window.addEventListener('resize', debouncedResize);
});

/**
 * 组件卸载时清理
 */
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.precipitation-chart {
  background: white;
  border-radius: 12px;
  padding: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.chart-legend {
  display: flex;
  gap: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
}

.legend-color {
  width: 12px;
  height: 3px;
  border-radius: 2px;
}

.legend-color.precip-line {
  background: #3b82f6;
}

.chart-container {
  position: relative;
  width: 100%;
  height: 250px;
  user-select: none;
  -webkit-user-select: none;
}

.chart-container::before,
.chart-container::after {
  display: none !important;
  background: none !important;
  box-shadow: none !important;
}

.chart-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

/* 禁用所有阴影效果 */
.chart-svg * {
  filter: none !important;
  box-shadow: none !important;
  text-shadow: none !important;
}

/* 禁用柱状图和数据点悬停时的阴影 */
.bar,
.bar:hover,
.data-point,
.data-point:hover {
  filter: none !important;
}

/* 网格线样式 */
.grid-line {
  stroke: #e5e7eb;
  stroke-width: 1;
  stroke-dasharray: 4, 4;
}

/* 柱状图样式 */
.bar {
  cursor: pointer;
  transition: all 0.2s ease;
}

.bar:hover {
  opacity: 0.8;
}

/* 折线样式 */
.precip-line {
  stroke: #3b82f6;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 5, 5;
}

/* 数据点样式 */
.data-point {
  fill: #3b82f6;
  stroke: white;
  stroke-width: 2;
  cursor: pointer;
  transition: all 0.2s ease;
}

.data-point:hover {
  fill: #1d4ed8;
  r: 6;
}

/* 坐标轴标签样式 */
.axis-label {
  font-size: 11px;
  fill: #6b7280;
}

/* 数值标签样式 */
.value-label {
  font-size: 10px;
  font-weight: 600;
  fill: #3b82f6;
  opacity: 0;
  animation: fadeInUp 0.4s ease-out forwards;
}

.value-label:nth-child(1) { animation-delay: 0.6s; }
.value-label:nth-child(2) { animation-delay: 0.65s; }
.value-label:nth-child(3) { animation-delay: 0.7s; }
.value-label:nth-child(4) { animation-delay: 0.75s; }
.value-label:nth-child(5) { animation-delay: 0.8s; }
.value-label:nth-child(6) { animation-delay: 0.85s; }
.value-label:nth-child(7) { animation-delay: 0.9s; }

/* 十字准星样式 */
.crosshair {
  stroke: #3b82f6;
  stroke-width: 1;
  stroke-dasharray: 4, 4;
  opacity: 0.5;
  pointer-events: none;
}

/* 动画关键帧 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes growUp {
  from {
    transform: scaleY(0);
  }
  to {
    transform: scaleY(1);
  }
}

/* 柱状图动画 */
.bar {
  transform-origin: bottom;
  animation: growUp 0.6s ease-out forwards;
}

.bar:nth-child(1) { animation-delay: 0.3s; }
.bar:nth-child(2) { animation-delay: 0.35s; }
.bar:nth-child(3) { animation-delay: 0.4s; }
.bar:nth-child(4) { animation-delay: 0.45s; }
.bar:nth-child(5) { animation-delay: 0.5s; }
.bar:nth-child(6) { animation-delay: 0.55s; }
.bar:nth-child(7) { animation-delay: 0.6s; }

/* 折线动画 */
.precip-line {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: drawLine 1s ease-out forwards;
}

@keyframes drawLine {
  to {
    stroke-dashoffset: 0;
  }
}

/* 数据点动画 */
.data-point {
  opacity: 0;
  animation: fadeInUp 0.4s ease-out forwards;
}

.data-point:nth-child(1) { animation-delay: 0.5s; }
.data-point:nth-child(2) { animation-delay: 0.55s; }
.data-point:nth-child(3) { animation-delay: 0.6s; }
.data-point:nth-child(4) { animation-delay: 0.65s; }
.data-point:nth-child(5) { animation-delay: 0.7s; }
.data-point:nth-child(6) { animation-delay: 0.75s; }
.data-point:nth-child(7) { animation-delay: 0.8s; }

/* 提示框样式 */
.chart-tooltip {
  position: absolute;
  background-color: #1f2937 !important;
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  pointer-events: none;
  transform: translateX(-50%);
  z-index: 10;
  min-width: 100px;
  text-align: center;
  box-shadow: none !important;
  text-shadow: none !important;
  filter: none !important;
  opacity: 1 !important;
  border: none !important;
  outline: none !important;
}

.tooltip-date {
  font-size: 11px;
  opacity: 0.8;
  margin-bottom: 4px;
}

.tooltip-precip {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 2px;
}

.tooltip-weather {
  font-size: 10px;
  opacity: 0.7;
}
</style>
