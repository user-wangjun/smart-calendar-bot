<template>
  <div class="desktop-right-sidebar-content">
    <!-- 第一部分：当日气候变化趋势图 -->
    <section class="weather-trend-section">
      <div class="section-header">
        <h2 class="section-title">今日天气趋势</h2>
        <span class="section-subtitle">0-24时降水数据</span>
      </div>
      <div class="chart-container">
        <div class="chart-scroll" ref="chartScroll">
          <div class="chart-wrapper">
            <canvas ref="chartCanvas" class="weather-chart"></canvas>
          </div>
        </div>
        <div class="scroll-indicator">
          <div class="scroll-bar" :style="{ width: scrollProgress + '%' }"></div>
        </div>
      </div>
      <div class="chart-legend">
        <div class="legend-item">
          <span class="legend-color precipitation"></span>
          <span class="legend-label">降水量</span>
        </div>
        <div class="legend-item">
          <span class="legend-color temperature"></span>
          <span class="legend-label">温度</span>
        </div>
      </div>
    </section>

    <!-- 第二部分：气象详细信息 -->
    <section class="weather-details-section">
      <div class="section-header">
        <h2 class="section-title">气象详情</h2>
      </div>
      <div class="details-grid">
        <div class="detail-card">
          <div class="detail-icon">💨</div>
          <div class="detail-info">
            <div class="detail-label">风速</div>
            <div class="detail-value">{{ weatherData.windSpeed }} m/s</div>
          </div>
        </div>
        <div class="detail-card">
          <div class="detail-icon">🧭</div>
          <div class="detail-info">
            <div class="detail-label">风向</div>
            <div class="detail-value">{{ weatherData.windDirection }}</div>
          </div>
        </div>
        <div class="detail-card">
          <div class="detail-icon">💧</div>
          <div class="detail-info">
            <div class="detail-label">降水量</div>
            <div class="detail-value">{{ weatherData.precipitation }} mm</div>
          </div>
        </div>
        <div class="detail-card">
          <div class="detail-icon">🌡</div>
          <div class="detail-info">
            <div class="detail-label">气压</div>
            <div class="detail-value">{{ weatherData.pressure }} hPa</div>
          </div>
        </div>
        <div class="detail-card">
          <div class="detail-icon">☀️</div>
          <div class="detail-info">
            <div class="detail-label">紫外线强度</div>
            <div class="detail-value">{{ weatherData.uvIndex }}</div>
          </div>
        </div>
        <div class="detail-card">
          <div class="detail-icon">🌅</div>
          <div class="detail-info">
            <div class="detail-label">日出时间</div>
            <div class="detail-value">{{ weatherData.sunrise }}</div>
          </div>
        </div>
        <div class="detail-card">
          <div class="detail-icon">🌇</div>
          <div class="detail-info">
            <div class="detail-label">日落时间</div>
            <div class="detail-value">{{ weatherData.sunset }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 第三部分：生活化建议与提示 -->
    <section class="life-suggestions-section">
      <div class="section-header">
        <h2 class="section-title">生活建议</h2>
      </div>
      <div class="suggestions-grid">
        <!-- 饮食推荐 -->
        <div class="suggestion-card">
          <div class="suggestion-icon">🍲</div>
          <div class="suggestion-content">
            <h3 class="suggestion-title">饮食推荐</h3>
            <p class="suggestion-text">{{ lifeSuggestions.diet }}</p>
          </div>
        </div>
        <!-- 出行建议 -->
        <div class="suggestion-card">
          <div class="suggestion-icon">🚗</div>
          <div class="suggestion-content">
            <h3 class="suggestion-title">出行建议</h3>
            <p class="suggestion-text">{{ lifeSuggestions.travel }}</p>
          </div>
        </div>
        <!-- 着装指南 -->
        <div class="suggestion-card">
          <div class="suggestion-icon">👕</div>
          <div class="suggestion-content">
            <h3 class="suggestion-title">着装指南</h3>
            <p class="suggestion-text">{{ lifeSuggestions.clothing }}</p>
          </div>
        </div>
        <!-- 健康提示 -->
        <div class="suggestion-card">
          <div class="suggestion-icon">💊</div>
          <div class="suggestion-content">
            <h3 class="suggestion-title">健康提示</h3>
            <p class="suggestion-text">{{ lifeSuggestions.health }}</p>
          </div>
        </div>
        <!-- 其他生活提示 -->
        <div class="suggestion-card full-width">
          <div class="suggestion-icon">💡</div>
          <div class="suggestion-content">
            <h3 class="suggestion-title">其他建议</h3>
            <p class="suggestion-text">{{ lifeSuggestions.other }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

// 天气数据
const weatherData = ref({
  windSpeed: '3.2',
  windDirection: '东北风',
  precipitation: '0',
  pressure: '1013',
  uvIndex: '中等',
  sunrise: '06:32',
  sunset: '18:45',
  hourlyData: []
});

// 生活建议数据
const lifeSuggestions = ref({
  diet: '今日天气晴朗，建议多吃清淡食物，多喝水',
  travel: '天气良好，适宜出行，注意防晒',
  clothing: '温度适中，建议穿着轻薄透气的衣物',
  health: '空气质量良好，适宜户外活动',
  other: '今日气候干燥，注意保湿'
});

// 滚动相关
const chartCanvas = ref(null);
const chartScroll = ref(null);
const scrollProgress = ref(0);

// 生成模拟的天气数据
const generateWeatherData = () => {
  const hourlyData = [];
  for (let i = 0; i < 24; i++) {
    hourlyData.push({
      hour: i,
      precipitation: Math.random() * 10,
      temperature: 20 + Math.random() * 10 - 5
    });
  }
  weatherData.value.hourlyData = hourlyData;
};

// 绘制天气趋势图
const drawWeatherChart = () => {
  if (!chartCanvas.value) return;
  
  const canvas = chartCanvas.value;
  const ctx = canvas.getContext('2d');
  const hourlyData = weatherData.value.hourlyData;
  
  // 设置canvas尺寸（PC端默认显示7小时）
  canvas.width = 24 * 50; // 每小时50px
  canvas.height = 200;
  
  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 绘制网格线
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = (canvas.height / 4) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  
  // 绘制降水数据曲线
  ctx.strokeStyle = '#667eea';
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  hourlyData.forEach((data, index) => {
    const x = index * 50 + 25;
    const maxPrecipitation = 10;
    const y = canvas.height - (data.precipitation / maxPrecipitation) * (canvas.height - 40);
    
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  
  ctx.stroke();
  
  // 绘制温度数据曲线
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  hourlyData.forEach((data, index) => {
    const x = index * 50 + 25;
    const minTemp = 15;
    const maxTemp = 25;
    const y = canvas.height - ((data.temperature - minTemp) / (maxTemp - minTemp)) * (canvas.height - 40);
    
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  
  ctx.stroke();
  
  // 绘制时间标签
  ctx.fillStyle = '#6b7280';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  
  hourlyData.forEach((data, index) => {
    if (index % 3 === 0) { // 每3小时显示一次
      const x = index * 50 + 25;
      const hourLabel = `${data.hour}:00`;
      ctx.fillText(hourLabel, x, canvas.height - 10);
    }
  });
};

// 处理图表滚动
const handleChartScroll = () => {
  if (!chartScroll.value) return;
  
  const scrollLeft = chartScroll.value.scrollLeft;
  const maxScroll = chartScroll.value.scrollWidth - chartScroll.value.clientWidth;
  scrollProgress.value = (scrollLeft / maxScroll) * 100;
};

// 组件挂载
onMounted(() => {
  // 生成天气数据
  generateWeatherData();
  
  // 绘制图表
  setTimeout(() => {
    drawWeatherChart();
  }, 100);
  
  // 添加滚动监听
  if (chartScroll.value) {
    chartScroll.value.addEventListener('scroll', handleChartScroll);
  }
});

// 组件卸载
onUnmounted(() => {
  if (chartScroll.value) {
    chartScroll.value.removeEventListener('scroll', handleChartScroll);
  }
});
</script>

<style scoped>
/* PC端右侧栏样式 */
.desktop-right-sidebar-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 天气趋势图部分 */
.weather-trend-section {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.section-subtitle {
  font-size: 16px;
  font-weight: 500;
  color: #6b7280;
}

.chart-container {
  position: relative;
  margin-bottom: 20px;
}

.chart-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.chart-scroll::-webkit-scrollbar {
  display: none;
}

.chart-wrapper {
  display: inline-block;
  min-width: 100%;
}

.weather-chart {
  display: block;
  border-radius: 8px;
}

.scroll-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.scroll-bar {
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.chart-legend {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.legend-color.precipitation {
  background: #667eea;
}

.legend-color.temperature {
  background: #f59e0b;
}

.legend-label {
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
}

/* 气象详细信息部分 */
.weather-details-section {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.detail-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.detail-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.detail-icon {
  font-size: 24px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 10px;
  flex-shrink: 0;
}

.detail-info {
  flex: 1;
  min-width: 0;
}

.detail-label {
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 4px;
}

.detail-value {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

/* 生活建议部分 */
.life-suggestions-section {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.suggestions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.suggestion-card {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.suggestion-card.full-width {
  grid-column: 1 / -1;
}

.suggestion-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.suggestion-icon {
  font-size: 32px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 10px;
  flex-shrink: 0;
}

.suggestion-content {
  flex: 1;
  min-width: 0;
}

.suggestion-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 12px;
}

.suggestion-text {
  font-size: 16px;
  line-height: 1.6;
  color: #6b7280;
}

/* 响应式优化 */
@media (max-width: 1200px) {
  .details-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .suggestions-grid {
    grid-template-columns: 1fr;
  }
  
  .suggestion-card.full-width {
    grid-column: auto;
  }
}

@media (max-width: 1024px) {
  .weather-trend-section,
  .weather-details-section,
  .life-suggestions-section {
    padding: 20px;
  }
  
  .section-title {
    font-size: 20px;
  }
  
  .section-subtitle {
    font-size: 14px;
  }
  
  .details-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .detail-card {
    padding: 16px;
  }
  
  .detail-icon {
    font-size: 22px;
    width: 44px;
    height: 44px;
  }
  
  .detail-value {
    font-size: 16px;
  }
  
  .suggestion-card {
    padding: 16px;
  }
  
  .suggestion-icon {
    font-size: 28px;
    width: 52px;
    height: 52px;
  }
  
  .suggestion-title {
    font-size: 16px;
  }
  
  .suggestion-text {
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .details-grid {
    grid-template-columns: 1fr;
  }
  
  .suggestions-grid {
    grid-template-columns: 1fr;
  }
  
  .weather-trend-section,
  .weather-details-section,
  .life-suggestions-section {
    padding: 16px;
  }
}
</style>
