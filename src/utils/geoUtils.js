/**
 * 地理工具函数模块
 * 提供地理位置相关的通用计算功能
 */

// WGS84 / GCJ02 转换常量
const PI = Math.PI;
const a = 6378245.0; // 长半轴
const ee = 0.006693421622965943; // 偏心率平方

/**
 * 角度转弧度
 * @param {number} degrees - 角度值
 * @returns {number} 弧度值
 */
export function toRadians (degrees) {
  return degrees * Math.PI / 180;
}

/**
 * 弧度转角度
 * @param {number} radians - 弧度值
 * @returns {number} 角度值
 */
export function toDegrees (radians) {
  return radians * 180 / Math.PI;
}

/**
 * 使用Haversine公式计算两个坐标点之间的距离
 * @param {number} lat1 - 位置1纬度
 * @param {number} lon1 - 位置1经度
 * @param {number} lat2 - 位置2纬度
 * @param {number} lon2 - 位置2经度
 * @returns {number} 距离（米）
 */
export function calculateDistance (lat1, lon1, lat2, lon2) {
  // 参数验证
  if (typeof lat1 !== 'number' || typeof lon1 !== 'number' ||
      typeof lat2 !== 'number' || typeof lon2 !== 'number') {
    return 0;
  }

  const R = 6371000; // 地球半径（米）
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);

  // Haversine公式
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * 计算两个位置对象之间的距离
 * @param {Object} location1 - 位置1对象，包含latitude和longitude
 * @param {Object} location2 - 位置2对象，包含latitude和longitude
 * @returns {number} 距离（米）
 */
export function calculateDistanceBetweenLocations (location1, location2) {
  if (!location1 || !location2) {
    return 0;
  }

  return calculateDistance(
    location1.latitude,
    location1.longitude,
    location2.latitude,
    location2.longitude
  );
}

/**
 * 格式化距离显示
 * @param {number} distance - 距离（米）
 * @returns {string} 格式化后的距离字符串
 */
export function formatDistance (distance) {
  if (distance < 1000) {
    return `${Math.round(distance)}米`;
  } else {
    return `${(distance / 1000).toFixed(1)}公里`;
  }
}

/**
 * 检查坐标是否在中国境内
 * @param {number} lat - 纬度
 * @param {number} lon - 经度
 * @returns {boolean} 是否在中国境内
 */
export function isInChina (lat, lon) {
  if (lon < 72.004 || lon > 137.8347) {
    return false;
  }
  if (lat < 0.8293 || lat > 55.8271) {
    return false;
  }
  return true;
}

function transformLat (x, y) {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(y * PI) + 40.0 * Math.sin(y / 3.0 * PI)) * 2.0 / 3.0;
  ret += (160.0 * Math.sin(y / 12.0 * PI) + 320 * Math.sin(y * PI / 30.0)) * 2.0 / 3.0;
  return ret;
}

function transformLon (x, y) {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(x * PI) + 40.0 * Math.sin(x / 3.0 * PI)) * 2.0 / 3.0;
  ret += (150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin(x / 30.0 * PI)) * 2.0 / 3.0;
  return ret;
}

/**
 * 坐标偏移纠正（WGS-84 to GCJ-02）
 * @param {number} lat - WGS-84纬度
 * @param {number} lon - WGS-84经度
 * @returns {Object} GCJ-02坐标 {latitude, longitude}
 */
export function wgs84ToGcj02 (lat, lon) {
  if (!isInChina(lat, lon)) {
    return { latitude: lat, longitude: lon };
  }

  let dLat = transformLat(lon - 105.0, lat - 35.0);
  let dLon = transformLon(lon - 105.0, lat - 35.0);
  const radLat = lat / 180.0 * PI;
  let magic = Math.sin(radLat);
  magic = 1 - ee * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * PI);
  dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * PI);
  const mgLat = lat + dLat;
  const mgLon = lon + dLon;
  return { latitude: mgLat, longitude: mgLon };
}

/**
 * 坐标反向纠正（GCJ-02 to WGS-84）
 * 粗略实现，用于需要还原真实GPS坐标的场景
 * @param {number} lat - GCJ-02纬度
 * @param {number} lon - GCJ-02经度
 * @returns {Object} WGS-84坐标 {latitude, longitude}
 */
export function gcj02ToWgs84 (lat, lon) {
  if (!isInChina(lat, lon)) {
    return { latitude: lat, longitude: lon };
  }
  const gcj = wgs84ToGcj02(lat, lon);
  const dLat = gcj.latitude - lat;
  const dLon = gcj.longitude - lon;
  return { latitude: lat - dLat, longitude: lon - dLon };
}

/**
 * 验证坐标有效性
 * @param {number} lat - 纬度
 * @param {number} lon - 经度
 * @returns {boolean} 是否有效
 */
export function validateCoordinates (lat, lon) {
  if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
    return false;
  }
  if (lat < -90 || lat > 90) return false;
  if (lon < -180 || lon > 180) return false;
  // 经纬度偏移>0.01度视为无效 (此处仅为范围校验，偏移校验需对比)
  return true;
}

/**
 * 验证海拔异常
 * @param {number} altitude - 当前海拔
 * @param {number} lastAltitude - 上次海拔
 * @returns {boolean} 是否需要二次验证
 */
export function checkAltitudeAnomaly (altitude, lastAltitude) {
  if (typeof altitude !== 'number' || typeof lastAltitude !== 'number') return false;
  // 海拔与周边地形差异>1000米触发二次验证 (简化为与上次差异)
  return Math.abs(altitude - lastAltitude) > 1000;
}

/**
 * 数据脱敏：经纬度精度降低至小数点后3位
 * @param {Object} location - 位置对象
 * @returns {Object} 脱敏后的位置对象
 */
export function desensitizeLocation (location) {
  if (!location) return null;
  const newLoc = { ...location };
  if (typeof newLoc.latitude === 'number') {
    newLoc.latitude = Number(newLoc.latitude.toFixed(3));
  }
  if (typeof newLoc.longitude === 'number') {
    newLoc.longitude = Number(newLoc.longitude.toFixed(3));
  }
  return newLoc;
}
