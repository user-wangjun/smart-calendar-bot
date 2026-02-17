/**
 * 响应式文本颜色组合式函数
 * 根据背景颜色自动调整文本颜色，确保WCAG 2.1 AA对比度标准
 */

import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import {
  getLuminance,
  getContrastRatio,
  getAccessibleTextColor
} from '@/utils/colorContrast.js';

/**
 * 使用响应式文本颜色
 * @param {Ref<string>|string} backgroundColor - 背景颜色（响应式引用或字符串）
 * @param {Object} options - 配置选项
 * @returns {Object} - 文本颜色相关的方法和状态
 */
export function useResponsiveTextColor (backgroundColor, options = {}) {
  const {
    targetRatio = 4.5, // WCAG AA标准对比度
    autoApply = false, // 是否自动应用到元素
    elementRef = null // 目标元素引用
  } = options;

  // 当前背景颜色
  const bgColor = ref(backgroundColor || '#FFFFFF');

  // 计算推荐的文本颜色
  const textColor = computed(() => {
    const color = typeof bgColor.value === 'string'
      ? bgColor.value
      : bgColor.value?.value || '#FFFFFF';

    return getAccessibleTextColor(color, targetRatio);
  });

  // 计算背景亮度
  const luminance = computed(() => {
    const color = typeof bgColor.value === 'string'
      ? bgColor.value
      : bgColor.value?.value || '#FFFFFF';

    return getLuminance(color);
  });

  // 计算对比度
  const contrastRatio = computed(() => {
    const color = typeof bgColor.value === 'string'
      ? bgColor.value
      : bgColor.value?.value || '#FFFFFF';

    return getContrastRatio(textColor.value, color);
  });

  // 是否满足WCAG AA标准
  const meetsWCAG = computed(() => contrastRatio.value >= targetRatio);

  // 是否为浅色背景
  const isLightBackground = computed(() => luminance.value > 0.5);

  // 应用文本颜色到元素
  const applyTextColor = (element = null) => {
    const target = element || elementRef?.value;
    if (!target) return;

    target.style.color = textColor.value;
  };

  // 监听背景颜色变化
  const stopWatch = watch(
    () => typeof backgroundColor === 'object' ? backgroundColor.value : backgroundColor,
    (newColor) => {
      if (newColor) {
        bgColor.value = newColor;
        if (autoApply && elementRef?.value) {
          applyTextColor();
        }
      }
    },
    { immediate: true }
  );

  // 自动应用（如果配置了）
  onMounted(() => {
    if (autoApply && elementRef?.value) {
      applyTextColor();
    }
  });

  // 清理
  onUnmounted(() => {
    stopWatch();
  });

  return {
    textColor, // 推荐的文本颜色
    luminance, // 背景亮度值
    contrastRatio, // 对比度比值
    meetsWCAG, // 是否满足WCAG标准
    isLightBackground, // 是否为浅色背景
    applyTextColor // 手动应用文本颜色方法
  };
}

/**
 * 使用动态背景检测
 * 自动检测元素的背景颜色并调整文本颜色
 * @param {Ref<HTMLElement>} elementRef - 元素引用
 * @param {Object} options - 配置选项
 * @returns {Object} - 动态颜色调整相关的方法和状态
 */
export function useDynamicTextColor (elementRef, options = {}) {
  const {
    targetRatio = 4.5,
    checkInterval = 1000, // 检测间隔（毫秒）
    observeChanges = true // 是否监听DOM变化
  } = options;

  const textColor = ref('#000000');
  const backgroundColor = ref('#FFFFFF');
  const contrastRatio = ref(21);
  let intervalId = null;
  let observer = null;

  // 更新文本颜色
  const updateTextColor = () => {
    const element = elementRef?.value;
    if (!element) return;

    // 获取计算后的背景颜色
    const computedStyle = window.getComputedStyle(element);
    const bg = computedStyle.backgroundColor;

    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
      backgroundColor.value = bg;
      textColor.value = getAccessibleTextColor(bg, targetRatio);
      contrastRatio.value = getContrastRatio(textColor.value, bg);

      // 应用文本颜色
      element.style.color = textColor.value;
    }
  };

  // 启动动态检测
  const start = () => {
    // 立即执行一次
    updateTextColor();

    // 定时检测
    if (checkInterval > 0) {
      intervalId = setInterval(updateTextColor, checkInterval);
    }

    // 使用 MutationObserver 监听样式变化
    if (observeChanges && elementRef?.value) {
      observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' &&
              (mutation.attributeName === 'style' ||
               mutation.attributeName === 'class')) {
            updateTextColor();
          }
        });
      });

      observer.observe(elementRef.value, {
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }
  };

  // 停止检测
  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  };

  // 生命周期管理
  onMounted(() => {
    start();
  });

  onUnmounted(() => {
    stop();
  });

  return {
    textColor,
    backgroundColor,
    contrastRatio,
    updateTextColor,
    start,
    stop
  };
}

/**
 * 使用批量文本颜色调整
 * 对多个元素批量应用响应式文本颜色
 * @param {Ref<HTMLElement[]>} elementsRef - 元素数组引用
 * @param {Ref<string>|string} backgroundColor - 背景颜色
 * @param {Object} options - 配置选项
 * @returns {Object} - 批量调整相关的方法
 */
export function useBatchTextColor (elementsRef, backgroundColor, options = {}) {
  const { targetRatio = 4.5 } = options;

  const results = ref([]);

  const applyToAll = () => {
    const elements = elementsRef?.value;
    if (!elements || !Array.isArray(elements)) return;

    const bg = typeof backgroundColor === 'object'
      ? backgroundColor.value
      : backgroundColor;

    results.value = elements.map((element, index) => {
      if (!element) return { index, success: false };

      try {
        const textColor = getAccessibleTextColor(bg, targetRatio);
        element.style.color = textColor;

        return {
          index,
          success: true,
          textColor,
          contrastRatio: getContrastRatio(textColor, bg)
        };
      } catch (error) {
        return { index, success: false, error: error.message };
      }
    });
  };

  // 监听背景颜色变化
  watch(
    () => typeof backgroundColor === 'object' ? backgroundColor.value : backgroundColor,
    () => {
      applyToAll();
    },
    { immediate: true }
  );

  return {
    results,
    applyToAll
  };
}

// 默认导出
export default {
  useResponsiveTextColor,
  useDynamicTextColor,
  useBatchTextColor
};
