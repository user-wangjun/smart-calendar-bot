<!--
  天气智能推荐组件
  展示穿衣、饮食、出行、运动等生活建议
-->
<template>
  <div class="weather-recommendations">
    <div class="recommendations-header">
      <h4 class="recommendations-title">💡 智能生活建议</h4>
      <span class="update-time">{{ formatUpdateTime(recommendations?.updateTime) }}</span>
    </div>

    <div class="recommendations-grid">
      <!-- 穿衣建议 -->
      <div class="recommendation-card clothing">
        <div class="card-icon">👔</div>
        <div class="card-content">
          <h5 class="card-title">穿衣建议</h5>
          <div class="card-body">
            <div class="temp-badge" :style="{ backgroundColor: recommendations?.clothing?.color + '20', color: recommendations?.clothing?.color }">
              {{ recommendations?.clothing?.description }}
            </div>
            <div class="clothing-list">
              <span v-for="(item, index) in recommendations?.clothing?.clothing" :key="index" class="clothing-item">
                {{ item }}
              </span>
            </div>
            <ul class="tips-list">
              <li v-for="(tip, index) in recommendations?.clothing?.tips" :key="index">{{ tip }}</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 饮食建议 -->
      <div class="recommendation-card diet">
        <div class="card-icon">🍽️</div>
        <div class="card-content">
          <h5 class="card-title">饮食建议</h5>
          <div class="card-body">
            <div class="diet-type">{{ recommendations?.diet?.description }}</div>
            <div class="food-section">
              <div class="section-label">推荐食物</div>
              <div class="food-tags">
                <span v-for="(food, index) in recommendations?.diet?.foods" :key="index" class="food-tag">
                  {{ food }}
                </span>
              </div>
            </div>
            <div class="drink-section">
              <div class="section-label">推荐饮品</div>
              <div class="drink-tags">
                <span v-for="(drink, index) in recommendations?.diet?.drinks" :key="index" class="drink-tag">
                  {{ drink }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 出行建议 -->
      <div class="recommendation-card travel">
        <div class="card-icon">🚗</div>
        <div class="card-content">
          <h5 class="card-title">出行建议</h5>
          <div class="card-body">
            <div class="travel-status">
              <span class="status-icon">{{ recommendations?.travel?.icon }}</span>
              <span class="status-text">{{ recommendations?.travel?.description }}</span>
            </div>
            <div class="travel-advice">{{ recommendations?.travel?.advice }}</div>
            <div class="precautions">
              <div class="section-label">注意事项</div>
              <ul class="precautions-list">
                <li v-for="(item, index) in recommendations?.travel?.precautions" :key="index">{{ item }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- 运动建议 -->
      <div class="recommendation-card exercise">
        <div class="card-icon">🏃</div>
        <div class="card-content">
          <h5 class="card-title">运动建议</h5>
          <div class="card-body">
            <div class="exercise-level" :style="{ backgroundColor: recommendations?.exercise?.color + '20', color: recommendations?.exercise?.color }">
              {{ recommendations?.exercise?.description }}
            </div>
            <div class="activities">
              <div class="section-label">推荐运动</div>
              <div class="activity-tags">
                <span v-for="(activity, index) in recommendations?.exercise?.activities" :key="index" class="activity-tag">
                  {{ activity }}
                </span>
              </div>
            </div>
            <ul class="tips-list">
              <li v-for="(tip, index) in recommendations?.exercise?.tips" :key="index">{{ tip }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- 健康提醒 -->
    <div v-if="recommendations?.health && recommendations.health.length > 0" class="health-reminders">
      <h5 class="reminders-title">🏥 健康提醒</h5>
      <div class="reminders-list">
        <div v-for="(reminder, index) in recommendations.health" :key="index" class="reminder-item" :class="reminder.type">
          <span class="reminder-icon">{{ reminder.icon }}</span>
          <div class="reminder-content">
            <div class="reminder-title">{{ reminder.title }}</div>
            <div class="reminder-text">{{ reminder.content }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 组件属性定义
 */
const props = defineProps({
  recommendations: {
    type: Object,
    default: () => ({})
  }
});

/**
 * 格式化更新时间
 * @param {string} timestamp - 时间戳
 * @returns {string} 格式化后的时间
 */
const formatUpdateTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>

<style scoped>
.weather-recommendations {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.recommendations-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.recommendations-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.update-time {
  font-size: 12px;
  color: #9ca3af;
}

.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.recommendation-card {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.recommendation-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 10px;
  flex-shrink: 0;
}

.card-content {
  flex: 1;
}

.card-title {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.card-body {
  font-size: 13px;
}

/* 穿衣建议样式 */
.temp-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
}

.clothing-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.clothing-item {
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #4b5563;
}

/* 饮食建议样式 */
.diet-type {
  font-weight: 600;
  color: #3b82f6;
  margin-bottom: 8px;
}

.food-section,
.drink-section {
  margin-bottom: 8px;
}

.section-label {
  font-size: 11px;
  color: #9ca3af;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.food-tags,
.drink-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.food-tag,
.drink-tag {
  background: #ecfdf5;
  color: #059669;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.drink-tag {
  background: #eff6ff;
  color: #3b82f6;
}

/* 出行建议样式 */
.travel-status {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.status-icon {
  font-size: 16px;
}

.status-text {
  font-weight: 600;
  color: #111827;
}

.travel-advice {
  color: #4b5563;
  margin-bottom: 8px;
}

.precautions-list {
  margin: 0;
  padding-left: 16px;
  color: #6b7280;
}

.precautions-list li {
  margin-bottom: 2px;
}

/* 运动建议样式 */
.exercise-level {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
}

.activities {
  margin-bottom: 8px;
}

.activity-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.activity-tag {
  background: #fef3c7;
  color: #d97706;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

/* 通用提示列表 */
.tips-list {
  margin: 0;
  padding-left: 16px;
  color: #6b7280;
  font-size: 12px;
}

.tips-list li {
  margin-bottom: 2px;
}

/* 健康提醒样式 */
.health-reminders {
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
}

.reminders-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.reminders-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reminder-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #f9fafb;
}

.reminder-item.warning {
  background: #fef2f2;
  border-left: 3px solid #ef4444;
}

.reminder-item.info {
  background: #eff6ff;
  border-left: 3px solid #3b82f6;
}

.reminder-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.reminder-content {
  flex: 1;
}

.reminder-title {
  font-weight: 600;
  font-size: 13px;
  color: #111827;
  margin-bottom: 2px;
}

.reminder-text {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .recommendations-grid {
    grid-template-columns: 1fr;
  }
}
</style>
