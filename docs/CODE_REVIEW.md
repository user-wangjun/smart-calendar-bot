# 代码审查文档：AI 模型模块重构

## 1. 变更摘要
本次重构旨在将 AI 助手的模型调用逻辑解耦为两个独立模块：**系统模型模块**（基于环境变量的智谱 AI）和**用户自选模型模块**（基于用户配置的通用 API）。

## 2. 主要修改点

### 2.1 架构调整 (`src/services/chatService.js`)
- **变更前**: 单一逻辑流，混杂了 API Key 的读取方式。
- **变更后**: 引入策略模式。
  - `modelMode === 'system'`: 强制使用 `ZhipuClient`，仅读取 `process.env.ZHIPU_API_KEY`。
  - `modelMode === 'custom'`: 使用 `UniversalClient`，读取 Store 中的动态配置。
- **优点**: 逻辑清晰，安全性提高（系统 Key 不会泄露给前端配置 UI），扩展性增强。

### 2.2 新增组件
- **`src/api/UniversalClient.js`**:
  - 实现了通用的 OpenAI 兼容接口调用。
  - 支持动态 `baseUrl` 和 `apiKey` 注入。
  - **审查意见**: 代码结构良好，错误处理完善。

- **`src/components/settings/SystemModelPanel.vue`**:
  - 专注于显示系统模型状态。
  - **审查意见**: UI 简洁，状态反馈明确。

- **`src/components/settings/CustomModelPanel.vue`**:
  - 提供了完整的自定义配置表单（平台、Key、URL、模型 ID、参数）。
  - 支持预设保存。
  - **审查意见**: 功能完备，表单验证逻辑合理。

### 2.3 状态管理 (`src/stores/settings.js`)
- 新增 `modelMode` 状态。
- 新增 `customModelConfig` 对象。
- **审查意见**: Store 结构合理，Actions 命名规范。

### 2.4 界面重构 (`src/views/AIAssistant.vue`)
- 移除了旧版单栏配置。
- 采用了左右双栏布局 (Split Pane)。
- **审查意见**: 布局响应式设计考虑周全，移动端适配良好。

## 3. 安全性审查
- **环境变量**: 智谱 API Key 仅在 `ZhipuClient` 内部通过 `env.js` 读取，前端 UI 无法直接查看或修改，符合安全要求。
- **自定义 Key**: 存储在浏览器 LocalStorage (Pinia Persist)，属于用户侧存储，风险可控（类似 API 调试工具）。

## 4. 兼容性考虑
- **向后兼容**: `ChatService` 接口保持 `sendMessage(message, options)` 签名不变，现有调用代码无需修改。
- **数据迁移**: 旧版配置如果存在，用户需要手动在"自选模型"中重新配置一次，这是一个可接受的一次性迁移成本。

## 5. 待优化项
- 目前自定义预设仅存储在本地，未来可考虑云端同步。
- `UniversalClient` 目前主要适配 OpenAI 格式，对于非 OpenAI 格式（如某些特定国产大模型原生接口）可能需要适配层，但目前通过兼容接口（如 OneAPI）可以解决。
