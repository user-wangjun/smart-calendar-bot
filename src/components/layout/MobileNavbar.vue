<template>
  <nav class="mobile-navbar">
    <div class="navbar-container">
      <!-- 左侧：汉堡菜单按钮 -->
      <button 
        class="hamburger-menu" 
        @click="toggleMenu"
        :class="{ 'active': isMenuOpen }"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <!-- 中间：地理位置显示 -->
      <div class="location-display" @click="openLocationModal">
        <span class="location-icon">📍</span>
        <span class="location-text">{{ shortLocationName }}</span>
        <span class="location-arrow">▼</span>
      </div>

      <!-- 右侧：日期选择器按钮 -->
      <button class="date-picker-btn" @click="openDatePicker">
        <span class="calendar-icon">📅</span>
      </button>
    </div>

    <!-- 地区选择模态窗口 -->
    <div class="location-modal-overlay" v-if="isLocationModalOpen" @click="closeLocationModal">
      <div class="location-modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">选择地区</h3>
          <button class="modal-close" @click="closeLocationModal">✕</button>
        </div>

        <!-- 搜索框 -->
        <div class="search-section">
          <input 
            type="search" 
            class="search-input" 
            v-model="searchQuery"
            placeholder="搜索地区..."
            @input="handleSearch"
          />
        </div>

        <!-- 层级选择器 -->
        <div class="hierarchy-selector">
          <!-- 省份列表 -->
          <div v-if="!selectedProvince" class="province-list">
            <div 
              v-for="province in filteredProvinces" 
              :key="province.code"
              class="province-item"
              @click="selectProvince(province)"
            >
              <span class="province-name">{{ province.name }}</span>
              <span class="province-arrow">›</span>
            </div>
          </div>

          <!-- 市份列表 -->
          <div v-else-if="!selectedCity" class="city-list">
            <button class="back-btn" @click="backToProvinces">
              <span>‹ 返回省份</span>
            </button>
            <div 
              v-for="city in filteredCities" 
              :key="city.code"
              class="city-item"
              @click="selectCity(city)"
            >
              <span class="city-name">{{ city.name }}</span>
              <span class="city-arrow">›</span>
            </div>
          </div>

          <!-- 区县列表 -->
          <div v-else class="district-list">
            <button class="back-btn" @click="backToCities">
              <span>‹ 返回城市</span>
            </button>
            <div 
              v-for="district in filteredDistricts" 
              :key="district.code"
              class="district-item"
              @click="selectDistrict(district)"
            >
              <span class="district-name">{{ district.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 侧边栏菜单 -->
    <div class="sidebar-overlay" v-if="isMenuOpen" @click="toggleMenu">
      <aside class="sidebar" @click.stop>
        <div class="sidebar-header">
          <h3 class="sidebar-title">菜单</h3>
          <button class="sidebar-close" @click="toggleMenu">✕</button>
        </div>
        <div class="sidebar-content">
          <router-link to="/home" class="sidebar-item" @click="toggleMenu">
            <span class="item-icon">🏠</span>
            <span class="item-text">首页</span>
          </router-link>
          <router-link to="/calendar" class="sidebar-item" @click="toggleMenu">
            <span class="item-icon">📅</span>
            <span class="item-text">日历</span>
          </router-link>
          <router-link to="/ai-assistant" class="sidebar-item" @click="toggleMenu">
            <span class="item-icon">🤖</span>
            <span class="item-text">AI助手</span>
          </router-link>
          <router-link to="/settings" class="sidebar-item" @click="toggleMenu">
            <span class="item-icon">⚙️</span>
            <span class="item-text">设置</span>
          </router-link>
        </div>
      </aside>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useSettingsStore } from '@/stores/settings';

// 使用设置store
const settingsStore = useSettingsStore();

// 响应式数据
const isMenuOpen = ref(false);
const isLocationModalOpen = ref(false);
const searchQuery = ref('');
const selectedProvince = ref(null);
const selectedCity = ref(null);
const selectedDistrict = ref(null);

// 省份数据（示例数据）
const provinces = ref([
  { code: 'GD', name: '广东省', cities: [
    { code: 'SG', name: '韶关市', districts: [
      { code: 'WJ', name: '武江区' },
      { code: 'ZJ', name: '浈江区' },
      { code: 'QC', name: '曲江区' },
      { code: 'SX', name: '始兴县' },
      { code: 'RY', name: '仁化县' },
      { code: 'NF', name: '南雄市' },
      { code: 'WB', name: '翁源县' },
      { code: 'XN', name: '新丰县' },
      { code: 'LE', name: '乐昌市' },
      { code: 'RH', name: '乳源瑶族自治县' }
    ]}
  ]},
  { code: 'BJ', name: '北京市', cities: [
    { code: 'CY', name: '朝阳区', districts: [
      { code: 'CY', name: '朝阳区' }
    ]},
    { code: 'HD', name: '海淀区', districts: [
      { code: 'HD', name: '海淀区' }
    ]}
  ]},
  { code: 'SH', name: '上海市', cities: [
    { code: 'HP', name: '黄浦区', districts: [
      { code: 'HP', name: '黄浦区' }
    ]},
    { code: 'XH', name: '徐汇区', districts: [
      { code: 'XH', name: '徐汇区' }
    ]}
  ]}
]);

// 计算属性：简称优化显示
const shortLocationName = computed(() => {
  if (selectedDistrict.value) {
    return selectedDistrict.value.name;
  }
  if (selectedCity.value) {
    return selectedCity.value.name;
  }
  if (selectedProvince.value) {
    return selectedProvince.value.name;
  }
  return '选择地区';
});

// 过滤后的省份数据
const filteredProvinces = computed(() => {
  if (!searchQuery.value) return provinces.value;
  const query = searchQuery.value.toLowerCase();
  return provinces.value.filter(province => 
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

// 方法：切换菜单
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

// 方法：打开地区选择模态窗口
const openLocationModal = () => {
  isLocationModalOpen.value = true;
  resetLocationSelection();
};

// 方法：关闭地区选择模态窗口
const closeLocationModal = () => {
  isLocationModalOpen.value = false;
};

// 方法：重置地区选择
const resetLocationSelection = () => {
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
  closeLocationModal();
  // 保存到设置store
  settingsStore.setLocation({
    province: selectedProvince.value.name,
    city: selectedCity.value.name,
    district: district.name,
    fullAddress: `${selectedProvince.value.name}${selectedCity.value.name}${district.name}`
  });
};

// 方法：处理搜索
const handleSearch = () => {
  // 搜索逻辑已在计算属性中处理
};

// 方法：打开日期选择器（待实现）
const openDatePicker = () => {
  // 触发日期选择器事件
  console.log('打开日期选择器');
};
</script>

<style scoped>
/* 移动端导航栏样式 */
.mobile-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 12px 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.navbar-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 100%;
  height: 56px;
}

/* 汉堡菜单按钮 */
.hamburger-menu {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 8px;
}

.hamburger-menu:active {
  transform: scale(0.95);
}

.hamburger-menu span {
  width: 20px;
  height: 2px;
  background: #ffffff;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.hamburger-menu span:nth-child(1) {
  margin-bottom: 4px;
}

.hamburger-menu span:nth-child(3) {
  margin-top: 4px;
}

.hamburger-menu.active span:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.hamburger-menu.active span:nth-child(2) {
  opacity: 0;
}

.hamburger-menu.active span:nth-child(3) {
  transform: rotate(-45deg) translate(5px, -5px);
}

/* 地理位置显示 */
.location-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  min-width: 0;
}

.location-display:active {
  background: rgba(255, 255, 255, 0.2);
}

.location-icon {
  font-size: 18px;
}

.location-text {
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.location-arrow {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  transition: transform 0.3s ease;
}

.location-display:active .location-arrow {
  transform: rotate(180deg);
}

/* 日期选择器按钮 */
.date-picker-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.date-picker-btn:active {
  transform: scale(0.95);
}

.calendar-icon {
  font-size: 20px;
}

/* 地区选择模态窗口 */
.location-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.location-modal {
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

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #ffffff;
}

/* 搜索框 */
.search-section {
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
.hierarchy-selector {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.province-list,
.city-list,
.district-list {
  display: flex;
  flex-direction: column;
}

.back-btn {
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

.back-btn:active {
  transform: scale(0.98);
}

.province-item,
.city-item,
.district-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.3s ease;
}

.province-item:active,
.city-item:active,
.district-item:active {
  background: #f3f4f6;
}

.province-item:hover,
.city-item:hover,
.district-item:hover {
  background: #f9fafb;
}

.province-name,
.city-name,
.district-name {
  font-size: 15px;
  font-weight: 500;
  color: #111827;
}

.province-arrow,
.city-arrow {
  font-size: 18px;
  color: #9ca3af;
}

/* 侧边栏 */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1500;
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 80%;
  max-width: 320px;
  height: 100vh;
  background: #ffffff;
  z-index: 1501;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
}

.sidebar-overlay:active .sidebar {
  transform: translateX(0);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.sidebar-title {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
}

.sidebar-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #ffffff;
  padding: 4px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.sidebar-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  text-decoration: none;
  color: #111827;
  transition: all 0.3s ease;
  border-bottom: 1px solid #f3f4f6;
}

.sidebar-item:active {
  background: #f3f4f6;
  color: #ffffff;
}

.sidebar-item:hover {
  background: #f9fafb;
}

.item-icon {
  font-size: 20px;
  width: 24px;
  text-align: center;
}

.item-text {
  font-size: 15px;
  font-weight: 500;
}

/* 响应式优化 */
@media (max-width: 480px) {
  .location-text {
    max-width: 100px;
    font-size: 13px;
  }
  
  .location-modal {
    width: 95%;
  }
}

@media (max-width: 360px) {
  .navbar-container {
    padding: 8px 12px;
  }
  
  .location-text {
    max-width: 80px;
    font-size: 12px;
  }
  
  .hamburger-menu,
  .date-picker-btn {
    width: 36px;
    height: 36px;
  }
}
</style>
