<!--
  温度曲线图组件
  展示24小时气温变化曲线
-->
<template>
  <div class="temperature-chart">
    <div class="chart-header">
      <h4 class="chart-title">🌡️ 24小时气温趋势</h4>
      <div class="chart-legend">
        <span class="legend-item">
          <span class="legend-color temp-line"></span>
          温度
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

        <!-- 平均温度线 -->
        <g v-if="averageTemp" class="average-line-group">
          <line
            :x1="padding.left"
            :y1="averageLineY"
            :x2="width - padding.right"
            :y2="averageLineY"
            class="average-line"
          />
          <text
            :x="width - padding.right + 5"
            :y="averageLineY + 4"
            class="average-label"
          >
            平均 {{ Math.round(averageTemp) }}°
          </text>
        </g>

        <!-- 温度曲线 -->
        <path
          :d="temperaturePath"
          class="temp-curve"
          fill="none"
          :style="curveStyle"
        />
        
        <!-- 温度区域填充 -->
        <path
          :d="temperatureAreaPath"
          class="temp-area"
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
            {{ label.text }}°
          </text>
        </g>

        <!-- 数值标签 -->
        <g class="value-labels">
          <text
            v-for="(point, index) in valueLabels"
            :key="`val-${index}`"
            :x="point.x"
            :y="point.y - 8"
            class="value-label"
            text-anchor="middle"
          >
            {{ point.value }}°
          </text>
        </g>

        <!-- 极值标记 -->
        <g class="extreme-points">
          <g
            v-for="(extreme, index) in extremePoints"
            :key="`extreme-${index}`"
          >
            <circle
              :cx="extreme.x"
              :cy="extreme.y"
              r="6"
              class="extreme-point"
            />
            <text
              :x="extreme.x"
              :y="extreme.y - 10"
              class="extreme-label"
              text-anchor="middle"
            >
              {{ extreme.type === 'max' ? '最高' : '最低' }} {{ Math.round(extreme.temp) }}°
            </text>
          </g>
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
        <div class="tooltip-time">{{ hourlyData[hoveredIndex]?.time }}</div>
        <div class="tooltip-temp">{{ hourlyData[hoveredIndex]?.temperature.toFixed(1) }}°C</div>
        <div class="tooltip-desc">{{ hourlyData[hoveredIndex]?.weather || '' }}</div>
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
  hourlyData: {
    type: Array,
    default: () => []
  }
});

/**
 * 图表尺寸配置
 */
const width = ref(800);
const height = ref(300);
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
 * 计算温度范围
 */
const tempRange = computed(() => {
  if (!props.hourlyData || !Array.isArray(props.hourlyData) || props.hourlyData.length === 0) {
    return { min: 0, max: 40 };
  }
  const temps = props.hourlyData.map(d => d.temperature);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const padding = (max - min) * 0.1;
  return {
    min: Math.floor(min - padding),
    max: Math.ceil(max + padding)
  };
});

/**
 * 计算数据点坐标
 */
const dataPoints = computed(() => {
  if (!props.hourlyData || !Array.isArray(props.hourlyData) || props.hourlyData.length === 0) return [];

  const data = props.hourlyData;
  const stepX = chartWidth.value / (data.length - 1);
  const tempSpan = tempRange.value.max - tempRange.value.min;
  
  return data.map((item, index) => ({
    x: padding.left + index * stepX,
    y: padding.top + chartHeight.value - ((item.temperature - tempRange.value.min) / tempSpan) * chartHeight.value,
    data: item
  }));
});

/**
 * 生成平滑曲线路径（使用贝塞尔曲线）
 */
const temperaturePath = computed(() => {
  if (dataPoints.value.length === 0) return '';
  
  const points = dataPoints.value;
  let path = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    
    // 计算控制点
    const cp1x = current.x + (next.x - current.x) * 0.5;
    const cp1y = current.y;
    const cp2x = current.x + (next.x - current.x) * 0.5;
    const cp2y = next.y;
    
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
  }
  
  return path;
});

/**
 * 生成区域填充路径
 */
const temperatureAreaPath = computed(() => {
  if (dataPoints.value.length === 0) return '';
  
  const points = dataPoints.value;
  const bottomY = padding.top + chartHeight.value;
  
  let path = `M ${points[0].x} ${bottomY}`;
  path += ` L ${points[0].x} ${points[0].y}`;
  
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    
    const cp1x = current.x + (next.x - current.x) * 0.5;
    const cp1y = current.y;
    const cp2x = current.x + (next.x - current.x) * 0.5;
    const cp2y = next.y;
    
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
  }
  
  path += ` L ${points[points.length - 1].x} ${bottomY} Z`;
  
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
 * X轴标签（每3小时显示一个）
 */
const xLabels = computed(() => {
  if (!props.hourlyData || !Array.isArray(props.hourlyData) || props.hourlyData.length === 0) return [];

  const labels = [];
  const stepX = chartWidth.value / (props.hourlyData.length - 1);

  props.hourlyData.forEach((item, index) => {
    if (index % 3 === 0) { // 每3小时显示一个标签
      labels.push({
        x: padding.left + index * stepX,
        text: item.time
      });
    }
  });

  return labels;
});

/**
 * 温度数值标签（每3小时显示一个）
 */
const valueLabels = computed(() => {
  if (!props.hourlyData || !Array.isArray(props.hourlyData) || props.hourlyData.length === 0) return [];

  const labels = [];
  const stepX = chartWidth.value / (props.hourlyData.length - 1);
  const tempSpan = tempRange.value.max - tempRange.value.min;

  props.hourlyData.forEach((item, index) => {
    if (index % 3 === 0) { // 每3小时显示一个数值
      const x = padding.left + index * stepX;
      const y = padding.top + chartHeight.value - ((item.temperature - tempRange.value.min) / tempSpan) * chartHeight.value;
      labels.push({
        x,
        y,
        value: item.temperature.toFixed(1)
      });
    }
  });

  return labels;
});

/**
 * Y轴标签
 */
const yLabels = computed(() => {
  const labels = [];
  const count = 5;
  const tempSpan = tempRange.value.max - tempRange.value.min;
  
  for (let i = 0; i <= count; i++) {
    const y = padding.top + (chartHeight.value / count) * i;
    const temp = tempRange.value.max - (tempSpan / count) * i;
    labels.push({
      y,
      text: Math.round(temp)
    });
  }
  
  return labels;
});

/**
 * 处理鼠标进入数据点
 */
const handleMouseEnter = (index) => {
  hoveredIndex.value = index;
  tooltipVisible.value = true;
  
  const point = dataPoints.value[index];
  if (point && chartContainer.value) {
    const rect = chartContainer.value.getBoundingClientRect();
    tooltipStyle.value = {
      left: `${point.x}px`,
      top: `${point.y - 60}px`
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
  if (!chartContainer.value || !props.hourlyData || props.hourlyData.length === 0) return;

  const rect = chartContainer.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const chartW = width.value - padding.left - padding.right;

  // 计算最近的数据点索引
  const stepX = chartW / (props.hourlyData.length - 1);
  let index = Math.round((x - padding.left) / stepX);
  index = Math.max(0, Math.min(index, props.hourlyData.length - 1));

  if (hoveredIndex.value !== index) {
    hoveredIndex.value = index;
    tooltipVisible.value = true;

    const point = dataPoints.value[index];
    if (point) {
      tooltipStyle.value = {
        left: `${point.x}px`,
        top: `${point.y - 60}px`
      };
    }
  }
};

/**
 * 曲线长度（用于动画）
 */
const curveStyle = computed(() => {
  // 估算路径长度用于动画
  const length = dataPoints.value.length * 30;
  return {
    '--path-length': `${length}`
  };
});

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
 * 最高温和最低温标记
 */
const extremePoints = computed(() => {
  if (!props.hourlyData || props.hourlyData.length === 0) return [];

  const temps = props.hourlyData.map((item, index) => ({
    temp: item.temperature,
    index
  }));

  const maxTemp = Math.max(...temps.map(t => t.temp));
  const minTemp = Math.min(...temps.map(t => t.temp));

  const extremes = [];
  const stepX = chartWidth.value / (props.hourlyData.length - 1);
  const tempSpan = tempRange.value.max - tempRange.value.min;

  temps.forEach(({ temp, index }) => {
    if (temp === maxTemp || temp === minTemp) {
      const x = padding.left + index * stepX;
      const y = padding.top + chartHeight.value - ((temp - tempRange.value.min) / tempSpan) * chartHeight.value;
      extremes.push({
        x,
        y,
        temp,
        type: temp === maxTemp ? 'max' : 'min'
      });
    }
  });

  return extremes;
});

/**
 * 平均温度线
 */
const averageTemp = computed(() => {
  if (!props.hourlyData || props.hourlyData.length === 0) return null;
  const sum = props.hourlyData.reduce((acc, item) => acc + item.temperature, 0);
  return sum / props.hourlyData.length;
});

const averageLineY = computed(() => {
  if (averageTemp.value === null) return 0;
  const tempSpan = tempRange.value.max - tempRange.value.min;
  return padding.top + chartHeight.value - ((averageTemp.value - tempRange.value.min) / tempSpan) * chartHeight.value;
});

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
  window.removeEventListener('resize', debouncedResize);
});
</script>

<style scoped>
.temperature-chart {
  background: white;
  border-radius: 12px;
  padding: 20px;
}

.temperature-chart:hover {
  background: white !important;
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

.legend-color.temp-line {
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
}

.chart-container {
  position: relative;
  width: 100%;
  height: 300px;
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

/* 禁用数据点悬停时的阴影 */
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

/* 温度曲线样式 */
.temp-curve {
  stroke: url(#tempGradient);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* 温度区域填充样式 */
.temp-area {
  fill: url(#areaGradient);
  opacity: 0.3;
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
  fill: #8b5cf6;
}

/* 坐标轴标签样式 */
.axis-label {
  font-size: 11px;
  fill: #6b7280;
}

/* 数值标签样式 */
.value-label {
  font-size: 11px;
  font-weight: 600;
  fill: #3b82f6;
}

/* 提示框样式 */
.chart-tooltip {
  position: absolute;
  background: #374151 !important;
  color: white;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 11px;
  line-height: 1.4;
  pointer-events: none;
  transform: translateX(-50%);
  z-index: 100;
  min-width: 60px;
  max-width: 120px;
  text-align: center;
  box-shadow: none !important;
  text-shadow: none !important;
  filter: none !important;
  opacity: 1 !important;
  border: none !important;
  outline: none !important;
  overflow: hidden;
  white-space: nowrap;
  will-change: transform;
}

.tooltip-time {
  font-size: 11px;
  opacity: 0.8;
  margin-bottom: 4px;
}

.tooltip-temp {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 2px;
}

.tooltip-desc {
  font-size: 10px;
  opacity: 0.7;
}

/* SVG渐变定义 */
.chart-svg :deep(defs) {
  display: none;
}

/* 动画关键帧 */
@keyframes drawLine {
  from {
    stroke-dashoffset: var(--path-length, 1000);
  }
  to {
    stroke-dashoffset: 0;
  }
}

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

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* 曲线绘制动画 */
.temp-curve {
  stroke-dasharray: var(--path-length, 1000);
  stroke-dashoffset: var(--path-length, 1000);
  animation: drawLine 1.5s ease-out forwards;
}

/* 区域填充动画 */
.temp-area {
  opacity: 0;
  animation: fadeInUp 0.8s ease-out 0.5s forwards;
}

/* 数据点动画 */
.data-point {
  opacity: 0;
  animation: fadeInUp 0.4s ease-out forwards;
  transform-origin: center;
}

.data-point:nth-child(1) { animation-delay: 0.6s; }
.data-point:nth-child(2) { animation-delay: 0.65s; }
.data-point:nth-child(3) { animation-delay: 0.7s; }
.data-point:nth-child(4) { animation-delay: 0.75s; }
.data-point:nth-child(5) { animation-delay: 0.8s; }
.data-point:nth-child(6) { animation-delay: 0.85s; }
.data-point:nth-child(7) { animation-delay: 0.9s; }
.data-point:nth-child(8) { animation-delay: 0.95s; }
.data-point:nth-child(9) { animation-delay: 1s; }
.data-point:nth-child(10) { animation-delay: 1.05s; }
.data-point:nth-child(11) { animation-delay: 1.1s; }
.data-point:nth-child(12) { animation-delay: 1.15s; }
.data-point:nth-child(13) { animation-delay: 1.2s; }
.data-point:nth-child(14) { animation-delay: 1.25s; }
.data-point:nth-child(15) { animation-delay: 1.3s; }
.data-point:nth-child(16) { animation-delay: 1.35s; }
.data-point:nth-child(17) { animation-delay: 1.4s; }
.data-point:nth-child(18) { animation-delay: 1.45s; }
.data-point:nth-child(19) { animation-delay: 1.5s; }
.data-point:nth-child(20) { animation-delay: 1.55s; }
.data-point:nth-child(21) { animation-delay: 1.6s; }
.data-point:nth-child(22) { animation-delay: 1.65s; }
.data-point:nth-child(23) { animation-delay: 1.7s; }
.data-point:nth-child(24) { animation-delay: 1.75s; }

/* 数值标签动画 */
.value-label {
  opacity: 0;
  animation: fadeInUp 0.4s ease-out forwards;
}

.value-label:nth-child(1) { animation-delay: 0.8s; }
.value-label:nth-child(2) { animation-delay: 0.9s; }
.value-label:nth-child(3) { animation-delay: 1s; }
.value-label:nth-child(4) { animation-delay: 1.1s; }
.value-label:nth-child(5) { animation-delay: 1.2s; }
.value-label:nth-child(6) { animation-delay: 1.3s; }
.value-label:nth-child(7) { animation-delay: 1.4s; }
.value-label:nth-child(8) { animation-delay: 1.5s; }

/* 悬停时的效果 */
.data-point:hover {
  opacity: 0.9;
}

/* 十字准星样式 */
.crosshair {
  stroke: #3b82f6;
  stroke-width: 1;
  stroke-dasharray: 4, 4;
  opacity: 0.5;
  pointer-events: none;
}

/* 极值标记样式 */
.extreme-point {
  fill: #ef4444;
  stroke: white;
  stroke-width: 2;
}

.extreme-label {
  font-size: 10px;
  font-weight: 600;
  fill: #ef4444;
}

/* 平均值线样式 */
.average-line {
  stroke: #10b981;
  stroke-width: 1;
  stroke-dasharray: 8, 4;
  opacity: 0.6;
}

.average-label {
  font-size: 10px;
  fill: #10b981;
  font-weight: 500;
}
</style>