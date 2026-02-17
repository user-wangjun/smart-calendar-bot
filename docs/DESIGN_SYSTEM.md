# 智能日历助手设计系统 (Design System)

## 概述

本设计系统基于 **Tailwind CSS v4** 构建，旨在提供一致、现代且高效的用户界面。

## 1. 色彩体系 (Colors)

我们使用语义化的颜色命名，支持亮色和深色模式自动切换。

### 主色 (Primary) - Blue
用于主要操作、高亮信息和品牌标识。
- `primary-50` ~ `primary-900`
- 默认: `primary-500` (#3b82f6)

### 辅色 (Secondary) - Violet
用于次要操作、装饰性元素。
- `secondary-50` ~ `secondary-900`
- 默认: `secondary-500` (#8b5cf6)

### 表面色 (Surface) - Slate
用于背景、边框和文本。
- `surface-50`: 浅色背景
- `surface-100`: 悬停背景
- `surface-200`: 边框/分割线
- `surface-500`: 次要文本
- `surface-900`: 主要文本

### 功能色 (Functional)
- **Success**: Green (#22c55e) - 成功状态
- **Warning**: Yellow (#eab308) - 警告/注意
- **Error**: Red (#ef4444) - 错误/危险操作

## 2. 字体排版 (Typography)

### 字体家族
- **Sans (无衬线)**: `Inter`, system-ui, sans-serif
- **Mono (等宽)**: `Fira Code`, monospace

### 字号规范
- `text-xs`: 12px (辅助信息)
- `text-sm`: 14px (正文/按钮)
- `text-base`: 16px (默认正文)
- `text-lg`: 18px (小标题)
- `text-xl`: 20px (卡片标题)
- `text-2xl`: 24px (页面标题)
- `text-3xl`: 30px (大标题)

## 3. 组件规范 (Components)

### 按钮 (BaseButton)
支持多种变体和尺寸：
- **Variant**: `primary`, `secondary`, `outline`, `ghost`, `danger`
- **Size**: `xs`, `sm`, `md`, `lg`
- **State**: `loading`, `disabled`

### 卡片 (BaseCard)
统一的容器风格：
- 圆角: `rounded-xl`
- 阴影: `shadow-card` (悬停时 `shadow-card-hover`)
- 背景: 白底 (亮色) / `surface-800` (深色)

### 图标 (Icons)
统一使用 **Lucide Vue Next** 图标库。
- 风格: 线性 (Stroke)
- 默认大小: 16px (w-4 h-4) 或 20px (w-5 h-5)

## 4. 布局 (Layout)

### Bento Grid (便当盒布局)
仪表盘采用模块化网格布局，适应不同屏幕尺寸：
- Mobile: 单列 (`grid-cols-1`)
- Tablet: 双列/三列 (`grid-cols-2` 或 `grid-cols-3`)
- Desktop: 四列 (`grid-cols-4`)

### 响应式断点
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

## 5. 动画 (Animation)

使用细腻的微交互增强体验：
- **Transition**: `duration-200` or `duration-300`
- **Hover**: 简单的颜色变化或轻微的上浮 (`-translate-y-1`)
- **Loading**: 骨架屏 (`animate-pulse`) 或 旋转图标 (`animate-spin`)
