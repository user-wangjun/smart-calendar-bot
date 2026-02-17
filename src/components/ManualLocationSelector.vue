<template>
  <BaseModal
    :model-value="visible"
    title="📍 手动设置位置"
    size="lg"
    @update:model-value="$emit('close')"
  >
    <div class="space-y-6">
      <!-- 步骤指示器 -->
      <div class="step-indicator">
        <div class="step" :class="{ active: currentStep === 1, completed: currentStep > 1 }">
          <div class="step-number">1</div>
          <span class="step-label">选择省份</span>
        </div>
        <div class="step-line" :class="{ completed: currentStep > 1 }"></div>
        <div class="step" :class="{ active: currentStep === 2, completed: currentStep > 2 }">
          <div class="step-number">2</div>
          <span class="step-label">选择城市</span>
        </div>
        <div class="step-line" :class="{ completed: currentStep > 2 }"></div>
        <div class="step" :class="{ active: currentStep === 3, completed: currentStep > 3 }">
          <div class="step-number">3</div>
          <span class="step-label">选择区县</span>
        </div>
      </div>

      <!-- 步骤1: 省份选择 -->
      <div v-if="currentStep === 1" class="step-content">
        <h4 class="text-sm font-semibold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
          <Map class="w-4 h-4 text-primary-500" />
          选择省份/直辖市
        </h4>
        <div class="province-grid">
          <button
            v-for="province in provinces"
            :key="province"
            class="province-btn"
            :class="{ selected: selectedProvince === province }"
            @click="selectProvince(province)"
          >
            {{ province }}
          </button>
        </div>
      </div>

      <!-- 步骤2: 城市选择 -->
      <div v-if="currentStep === 2" class="step-content">
        <div class="step-header">
          <h4 class="text-sm font-semibold text-surface-900 dark:text-white flex items-center gap-2">
            <Building2 class="w-4 h-4 text-primary-500" />
            选择城市
            <span v-if="selectedProvince" class="text-xs text-surface-500 font-normal">
              ({{ selectedProvince }})
            </span>
          </h4>
          <button class="back-btn" @click="goBack">
            <ArrowLeft class="w-4 h-4" />
            返回省份
          </button>
        </div>
        <div class="city-grid">
          <button
            v-for="city in citiesByProvince"
            :key="city.adcode"
            class="city-btn"
            :class="{ selected: selectedCity?.adcode === city.adcode }"
            @click="selectCity(city)"
          >
            {{ city.name.replace('市', '') }}
          </button>
        </div>
      </div>

      <!-- 步骤3: 区县选择 -->
      <div v-if="currentStep === 3" class="step-content">
        <div class="step-header">
          <h4 class="text-sm font-semibold text-surface-900 dark:text-white flex items-center gap-2">
            <MapPin class="w-4 h-4 text-primary-500" />
            选择区县
            <span v-if="selectedCity" class="text-xs text-surface-500 font-normal">
              ({{ selectedCity.name }})
            </span>
          </h4>
          <button class="back-btn" @click="goBack">
            <ArrowLeft class="w-4 h-4" />
            返回城市
          </button>
        </div>

        <!-- 城市无区县数据提示 -->
        <div v-if="!hasDistricts" class="no-districts">
          <p class="text-sm text-surface-500 mb-3">该城市暂无详细区县数据</p>
          <button class="confirm-btn" @click="confirmWithoutDistrict">
            <Check class="w-4 h-4" />
            确认选择 {{ selectedCity?.name }}
          </button>
        </div>

        <!-- 区县网格 -->
        <div v-else class="district-grid">
          <button
            v-for="district in districts"
            :key="district.adcode"
            class="district-btn"
            :class="{ selected: selectedDistrict?.adcode === district.adcode }"
            @click="selectDistrict(district)"
          >
            {{ district.name }}
          </button>
        </div>

        <!-- 跳过区县选择 -->
        <div v-if="hasDistricts" class="skip-district">
          <button class="skip-btn" @click="confirmWithoutDistrict">
            不选具体区县，使用 {{ selectedCity?.name }} 整体位置
          </button>
        </div>
      </div>

      <!-- 已选位置预览 -->
      <div v-if="selectionPreview" class="selection-preview">
        <h4 class="preview-title">已选位置</h4>
        <div class="preview-content">
          <div class="location-path">
            <span class="path-item">{{ selectedProvince }}</span>
            <ChevronRight class="w-4 h-4 text-surface-400" />
            <span class="path-item">{{ selectedCity?.name }}</span>
            <template v-if="selectedDistrict">
              <ChevronRight class="w-4 h-4 text-surface-400" />
              <span class="path-item highlight">{{ selectedDistrict.name }}</span>
            </template>
          </div>
          <button v-if="currentStep === 3 || !hasDistricts" class="confirm-btn" @click="confirmSelection">
            <Check class="w-4 h-4" />
            确认选择
          </button>
        </div>
      </div>

      <!-- 快速搜索 -->
      <div class="quick-search">
        <h4 class="text-sm font-semibold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
          <Search class="w-4 h-4 text-warning-500" />
          快速搜索
        </h4>
        <div class="relative">
          <BaseInput
            v-model="searchKeyword"
            placeholder="搜索城市或区县（如：北京、朝阳、天河）"
            @input="handleSearch"
          >
            <template #prefix>
              <Search class="w-4 h-4" />
            </template>
          </BaseInput>
        </div>

        <!-- 搜索结果 -->
        <div v-if="searchKeyword && searchResults.length > 0" class="search-results">
          <div
            v-for="result in searchResults"
            :key="result.adcode"
            class="search-result-item"
            @click="selectFromSearch(result)"
          >
            <div class="result-info">
              <span class="result-name">{{ result.name }}</span>
              <span class="result-type" :class="result.type">{{ getTypeLabel(result.type) }}</span>
            </div>
            <span class="result-path">{{ result.path }}</span>
          </div>
        </div>

        <!-- 无搜索结果 -->
        <div v-else-if="searchKeyword && searchResults.length === 0" class="no-results">
          <MapPinOff class="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>未找到匹配的位置</p>
          <p class="text-xs mt-1">请尝试输入城市或区县名称</p>
        </div>
      </div>

      <!-- 热门城市快捷入口 -->
      <div v-if="!searchKeyword" class="hot-cities">
        <h4 class="text-sm font-semibold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
          <Flame class="w-4 h-4 text-warning-500" />
          热门城市
        </h4>
        <div class="hot-cities-grid">
          <button
            v-for="city in hotCities"
            :key="city.adcode"
            class="hot-city-btn"
            @click="selectFromHotCity(city)"
          >
            {{ city.name.replace('市', '') }}
          </button>
        </div>
      </div>
    </div>

    <template #footer>
      <p class="text-xs text-surface-500 w-full text-center">
        选择具体位置后将自动获取该地区的天气信息
      </p>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import cityDataService from '@/services/cityDataService.js';
import BaseModal from '@/components/base/BaseModal.vue';
import BaseInput from '@/components/base/BaseInput.vue';
import {
  Search,
  MapPinOff,
  Flame,
  Map,
  Building2,
  MapPin,
  ArrowLeft,
  ChevronRight,
  Check
} from 'lucide-vue-next';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['select', 'close']);

// 步骤状态
const currentStep = ref(1);
const selectedProvince = ref('');
const selectedCity = ref(null);
const selectedDistrict = ref(null);

// 搜索状态
const searchKeyword = ref('');
const searchResults = ref([]);

// 计算属性
const provinces = computed(() => cityDataService.getProvinces());
const hotCities = computed(() => cityDataService.getHotCities());

const citiesByProvince = computed(() => {
  if (!selectedProvince.value) return [];
  return cityDataService.getCitiesByProvinceName(selectedProvince.value);
});

const districts = computed(() => {
  if (!selectedCity.value) return [];
  return cityDataService.getDistrictsByCity(selectedCity.value.adcode);
});

const hasDistricts = computed(() => {
  return districts.value.length > 0;
});

const selectionPreview = computed(() => {
  return selectedProvince.value && selectedCity.value;
});

// 监听模态框显示状态，重置选择
watch(() => props.visible, (newVal) => {
  if (newVal) {
    resetSelection();
  }
});

// 选择省份
const selectProvince = (province) => {
  selectedProvince.value = province;
  selectedCity.value = null;
  selectedDistrict.value = null;
  currentStep.value = 2;
};

// 选择城市
const selectCity = (city) => {
  selectedCity.value = city;
  selectedDistrict.value = null;

  // 检查城市是否有区县数据
  const cityDistricts = cityDataService.getDistrictsByCity(city.adcode);
  if (cityDistricts.length > 0) {
    currentStep.value = 3;
  } else {
    // 无区县数据，直接确认
    confirmSelection();
  }
};

// 选择区县
const selectDistrict = (district) => {
  selectedDistrict.value = district;
};

// 返回上一步
const goBack = () => {
  if (currentStep.value === 3) {
    selectedDistrict.value = null;
    currentStep.value = 2;
  } else if (currentStep.value === 2) {
    selectedCity.value = null;
    currentStep.value = 1;
  }
};

// 不选区县直接确认
const confirmWithoutDistrict = () => {
  confirmSelection();
};

// 确认选择
const confirmSelection = () => {
  const result = {
    province: selectedProvince.value,
    city: selectedCity.value?.name || '',
    cityAdcode: selectedCity.value?.adcode || '',
    district: selectedDistrict.value?.name || null,
    districtAdcode: selectedDistrict.value?.adcode || null,
    source: 'manual',
    provider: 'manual'
  };

  emit('select', result);
  handleClose();
};

// 搜索处理
const handleSearch = (value) => {
  if (value && value.trim()) {
    const keyword = value.trim();
    const results = [];

    // 搜索城市
    const cities = cityDataService.searchCities(keyword);
    cities.forEach(city => {
      results.push({
        type: 'city',
        name: city.name,
        adcode: city.adcode,
        path: city.province,
        data: city
      });
    });

    // 搜索区县
    const districts = cityDataService.searchDistricts(keyword);
    districts.forEach(district => {
      results.push({
        type: 'district',
        name: district.name,
        adcode: district.adcode,
        path: `${district.province} > ${district.city}`,
        data: district
      });
    });

    searchResults.value = results.slice(0, 10); // 限制结果数量
  } else {
    searchResults.value = [];
  }
};

// 从搜索结果选择
const selectFromSearch = (result) => {
  if (result.type === 'city') {
    const city = result.data;
    selectedProvince.value = city.province;
    selectCity(city);
  } else if (result.type === 'district') {
    const district = result.data;
    selectedProvince.value = district.province;
    selectedCity.value = {
      name: district.city,
      adcode: district.cityAdcode
    };
    selectedDistrict.value = {
      name: district.name,
      adcode: district.adcode
    };
    currentStep.value = 3;
  }
  searchKeyword.value = '';
  searchResults.value = [];
};

// 从热门城市选择
const selectFromHotCity = (city) => {
  selectedProvince.value = city.province;
  selectCity(city);
};

// 获取类型标签
const getTypeLabel = (type) => {
  const labels = {
    city: '城市',
    district: '区县'
  };
  return labels[type] || type;
};

// 重置选择
const resetSelection = () => {
  currentStep.value = 1;
  selectedProvince.value = '';
  selectedCity.value = null;
  selectedDistrict.value = null;
  searchKeyword.value = '';
  searchResults.value = [];
};

// 关闭处理
const handleClose = () => {
  resetSelection();
  emit('close');
};
</script>

<style scoped>
/* 步骤指示器 */
.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 0;
  border-bottom: 1px solid var(--main-border-primary);
}

.dark .step-indicator {
  border-color: var(--dark-border-primary);
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.step-number {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: var(--main-bg-tertiary);
  color: var(--main-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.dark .step-number {
  background: var(--dark-bg-tertiary);
  color: var(--dark-text-muted);
}

.step.active .step-number {
  background: #3b82f6;
  color: white;
}

.step.completed .step-number {
  background: #10b981;
  color: white;
}

.step-label {
  font-size: 0.75rem;
  color: var(--main-text-muted);
  transition: color 0.3s ease;
}

.dark .step-label {
  color: var(--dark-text-muted);
}

.step.active .step-label {
  color: #3b82f6;
  font-weight: 500;
}

.step.completed .step-label {
  color: #10b981;
}

.step-line {
  width: 3rem;
  height: 2px;
  background: var(--main-border-primary);
  margin: 0 0.5rem;
  margin-bottom: 1.25rem;
  transition: background 0.3s ease;
}

.dark .step-line {
  background: var(--dark-border-primary);
}

.step-line.completed {
  background: #10b981;
}

/* 步骤内容 */
.step-content {
  animation: fadeIn 0.3s ease;
}

.step-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: rgba(59, 130, 246, 0.2);
}

/* 省份网格 */
.province-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

@media (max-width: 640px) {
  .province-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.province-btn {
  padding: 0.75rem 0.5rem;
  font-size: 0.875rem;
  color: var(--main-text-secondary);
  background: var(--main-bg-secondary);
  border: 1px solid var(--main-border-primary);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dark .province-btn {
  color: var(--dark-text-secondary);
  background: var(--dark-bg-secondary);
  border-color: var(--dark-border-primary);
}

.province-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.province-btn.selected {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

/* 城市网格 */
.city-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
  max-height: 240px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

@media (max-width: 640px) {
  .city-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.city-btn {
  padding: 0.5rem;
  font-size: 0.8125rem;
  color: var(--main-text-secondary);
  background: var(--main-bg-secondary);
  border: 1px solid var(--main-border-primary);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dark .city-btn {
  color: var(--dark-text-secondary);
  background: var(--dark-bg-secondary);
  border-color: var(--dark-border-primary);
}

.city-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.city-btn.selected {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

/* 区县网格 */
.district-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

@media (max-width: 640px) {
  .district-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.district-btn {
  padding: 0.5rem;
  font-size: 0.8125rem;
  color: var(--main-text-secondary);
  background: var(--main-bg-secondary);
  border: 1px solid var(--main-border-primary);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dark .district-btn {
  color: var(--dark-text-secondary);
  background: var(--dark-bg-secondary);
  border-color: var(--dark-border-primary);
}

.district-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.district-btn.selected {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

/* 无区县提示 */
.no-districts {
  text-align: center;
  padding: 2rem;
  background: var(--main-bg-secondary);
  border-radius: 0.5rem;
}

.dark .no-districts {
  background: var(--dark-bg-secondary);
}

.skip-district {
  margin-top: 1rem;
  text-align: center;
}

.skip-btn {
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  color: var(--main-text-muted);
  background: transparent;
  border: 1px dashed var(--main-border-primary);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dark .skip-btn {
  color: var(--dark-text-muted);
  border-color: var(--dark-border-primary);
}

.skip-btn:hover {
  color: #3b82f6;
  border-color: #3b82f6;
}

/* 选择预览 */
.selection-preview {
  padding: 1rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 0.75rem;
}

.dark .selection-preview {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%);
  border-color: rgba(59, 130, 246, 0.3);
}

.preview-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #3b82f6;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.preview-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

@media (max-width: 640px) {
  .preview-content {
    flex-direction: column;
    align-items: stretch;
  }
}

.location-path {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.path-item {
  font-size: 0.875rem;
  color: var(--main-text-secondary);
  padding: 0.25rem 0.5rem;
  background: white;
  border-radius: 0.25rem;
}

.dark .path-item {
  color: var(--dark-text-secondary);
  background: rgba(255, 255, 255, 0.1);
}

.path-item.highlight {
  background: #3b82f6;
  color: white;
  font-weight: 500;
}

.confirm-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  background: #3b82f6;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.confirm-btn:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

/* 快速搜索 */
.quick-search {
  padding-top: 1rem;
  border-top: 1px solid var(--main-border-primary);
}

.dark .quick-search {
  border-color: var(--dark-border-primary);
}

.search-results {
  margin-top: 0.75rem;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--main-border-primary);
  border-radius: 0.5rem;
}

.dark .search-results {
  border-color: var(--dark-border-primary);
}

.search-result-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.2s ease;
  border-bottom: 1px solid var(--main-border-primary);
}

.dark .search-result-item {
  border-color: var(--dark-border-primary);
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover {
  background: var(--main-bg-secondary);
}

.dark .search-result-item:hover {
  background: var(--dark-bg-secondary);
}

.result-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.result-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--main-text-primary);
}

.dark .result-name {
  color: var(--dark-text-primary);
}

.result-type {
  font-size: 0.625rem;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  font-weight: 500;
}

.result-type.city {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.result-type.district {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.result-path {
  font-size: 0.75rem;
  color: var(--main-text-muted);
}

.dark .result-path {
  color: var(--dark-text-muted);
}

.no-results {
  text-align: center;
  padding: 1.5rem;
  color: var(--main-text-muted);
}

.dark .no-results {
  color: var(--dark-text-muted);
}

/* 热门城市 */
.hot-cities {
  padding-top: 1rem;
  border-top: 1px solid var(--main-border-primary);
}

.dark .hot-cities {
  border-color: var(--dark-border-primary);
}

.hot-cities-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.5rem;
}

@media (max-width: 640px) {
  .hot-cities-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.hot-city-btn {
  padding: 0.5rem;
  font-size: 0.8125rem;
  color: var(--main-text-secondary);
  background: var(--main-bg-secondary);
  border: 1px solid var(--main-border-primary);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dark .hot-city-btn {
  color: var(--dark-text-secondary);
  background: var(--dark-bg-secondary);
  border-color: var(--dark-border-primary);
}

.hot-city-btn:hover {
  border-color: #f59e0b;
  color: #f59e0b;
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
