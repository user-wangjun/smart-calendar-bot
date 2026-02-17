<template>
  <div class="location-selector" v-if="isOpen">
    <div class="location-selector-overlay" @click="close"></div>
    <div class="location-selector-modal" @click.stop>
      <div class="location-selector-header">
        <h3 class="location-selector-title">选择地区</h3>
        <button class="location-selector-close" @click="close">✕</button>
      </div>

      <!-- 搜索框 -->
      <div class="location-selector-search">
        <input 
          type="search" 
          class="search-input" 
          v-model="searchQuery"
          placeholder="搜索地区..."
          @input="handleSearch"
        />
      </div>

      <!-- 层级选择器 -->
      <div class="location-selector-content">
        <!-- 省份列表 -->
        <div v-if="!selectedProvince" class="location-list">
          <div 
            v-for="province in filteredProvinces" 
            :key="province.code"
            class="location-item"
            @click="selectProvince(province)"
          >
            <span class="location-name">{{ province.name }}</span>
            <span class="location-arrow">›</span>
          </div>
        </div>

        <!-- 市份列表 -->
        <div v-else-if="!selectedCity" class="location-list">
          <button class="location-back-btn" @click="backToProvinces">
            <span>‹ 返回省份</span>
          </button>
          <div 
            v-for="city in filteredCities" 
            :key="city.code"
            class="location-item"
            @click="selectCity(city)"
          >
            <span class="location-name">{{ city.name }}</span>
            <span class="location-arrow">›</span>
          </div>
        </div>

        <!-- 区县列表 -->
        <div v-else class="location-list">
          <button class="location-back-btn" @click="backToCities">
            <span>‹ 返回城市</span>
          </button>
          <div 
            v-for="district in filteredDistricts" 
            :key="district.code"
            class="location-item"
            @click="selectDistrict(district)"
          >
            <span class="location-name">{{ district.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

// Props
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  provinces: {
    type: Array,
    default: () => []
  }
});

// Emits
const emit = defineEmits(['close', 'select']);

// 响应式数据
const searchQuery = ref('');
const selectedProvince = ref(null);
const selectedCity = ref(null);
const selectedDistrict = ref(null);

// 过滤后的省份数据
const filteredProvinces = computed(() => {
  if (!searchQuery.value) return props.provinces;
  const query = searchQuery.value.toLowerCase();
  return props.provinces.filter(province => 
    province.name.toLowerCase().includes(query)
  );
});

// 过滤后的城市数据
const filteredCities = computed(() => {
  if (!selectedProvince.value) return [];
  const cities = selectedProvince.value.cities || [];
  if (!searchQuery.value) return cities;
  const query = searchQuery.value.toLowerCase();
  return cities.filter(city => city.name.toLowerCase().includes(query));
});

// 过滤后的区县数据
const filteredDistricts = computed(() => {
  if (!selectedCity.value) return [];
  const districts = selectedCity.value.districts || [];
  if (!searchQuery.value) return districts;
  const query = searchQuery.value.toLowerCase();
  return districts.filter(district => district.name.toLowerCase().includes(query));
});

// 方法：关闭选择器
const close = () => {
  emit('close');
};

// 方法：重置选择
const resetSelection = () => {
  selectedProvince.value = null;
  selectedCity.value = null;
  selectedDistrict.value = null;
  searchQuery.value = '';
};

// 方法：选择省份
const selectProvince = (province) => {
  selectedProvince.value = province;
  selectedCity.value = null;
  selectedDistrict.value = null;
  searchQuery.value = '';
};

// 方法：返回省份列表
const backToProvinces = () => {
  selectedProvince.value = null;
  selectedCity.value = null;
  selectedDistrict.value = null;
  searchQuery.value = '';
};

// 方法：选择城市
const selectCity = (city) => {
  selectedCity.value = city;
  selectedDistrict.value = null;
  searchQuery.value = '';
};

// 方法：返回城市列表
const backToCities = () => {
  selectedCity.value = null;
  selectedDistrict.value = null;
  searchQuery.value = '';
};

// 方法：选择区县
const selectDistrict = (district) => {
  selectedDistrict.value = district;
  
  // 触发选择事件
  emit('select', {
    province: selectedProvince.value,
    city: selectedCity.value,
    district: district,
    fullAddress: `${selectedProvince.value.name}${selectedCity.value.name}${district.name}`
  });
  
  // 关闭选择器
  close();
};

// 方法：处理搜索
const handleSearch = () => {
  // 搜索逻辑已在计算属性中处理
};

// 监听isOpen变化
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    resetSelection();
  }
});
</script>

<style scoped>
/* 地区选择器样式 */
.location-selector {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.location-selector-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.location-selector-modal {
  position: relative;
  background: #ffffff;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.location-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.location-selector-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.location-selector-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.location-selector-close:hover {
  background: #f3f4f6;
  color: #ffffff;
}

/* 搜索框 */
.location-selector-search {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
  color: #111827;
  background: #f9fafb;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-input::placeholder {
  color: #9ca3af;
}

/* 层级选择器 */
.location-selector-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.location-list {
  display: flex;
  flex-direction: column;
}

.location-back-btn {
  width: 100%;
  padding: 12px 16px;
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 12px;
}

.location-back-btn:active {
  transform: scale(0.98);
}

.location-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.3s ease;
}

.location-item:active {
  background: #f3f4f6;
}

.location-item:hover {
  background: #f9fafb;
}

.location-name {
  font-size: 15px;
  font-weight: 500;
  color: #111827;
}

.location-arrow {
  font-size: 18px;
  color: #9ca3af;
}

/* 响应式优化 */
@media (max-width: 480px) {
  .location-selector-modal {
    width: 95%;
  }
  
  .location-selector-header,
  .location-selector-search {
    padding: 12px 16px;
  }
  
  .location-item {
    padding: 12px 14px;
  }
  
  .location-name {
    font-size: 14px;
  }
}
</style>
