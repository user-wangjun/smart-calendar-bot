# API 接口文档

## 概述
本文档描述了智能日历助手后端服务与前端交互的核心 API 接口，特别是新增的模型配置与调用模块。

## 1. 聊天接口

### 1.1 发送消息
前端通过 `ChatService` 调用此接口与 AI 模型进行交互。

- **方法**: `ChatService.sendMessage(message, options)`
- **参数**:
  - `message` (String): 用户输入的文本消息。
  - `options` (Object): 可选配置。
    - `stream` (Boolean): 是否开启流式传输 (默认: `false`)。
    - `timeout` (Number): 超时时间 (毫秒)。

- **内部处理逻辑**:
  系统根据 `SettingsStore` 中的 `modelMode` 状态自动路由请求：
  - `modelMode = 'system'`: 使用系统预置的智谱 AI 客户端 (`ZhipuClient`)。
  - `modelMode = 'custom'`: 使用用户自定义的通用客户端 (`UniversalClient`)。

- **响应格式**:
  ```json
  {
    "success": true,
    "content": "AI的回复内容...",
    "metadata": {
      "usage": {
        "prompt_tokens": 10,
        "completion_tokens": 20,
        "total_tokens": 30
      },
      "model": "glm-4"
    }
  }
  ```

## 2. 模型配置接口 (前端状态管理)

### 2.1 获取当前模式
- **Store**: `useSettingsStore`
- **State**: `modelMode` ('system' | 'custom')

### 2.2 更新自定义配置
- **Action**: `updateCustomConfig(config)`
- **参数**:
  ```javascript
  {
    platform: 'openai', // 平台标识 (openai, anthropic, etc.)
    apiKey: 'sk-...',   // API 密钥
    baseUrl: '...',     // API 基础地址
    modelId: 'gpt-4',   // 模型 ID
    parameters: {       // 模型参数
      temperature: 0.7,
      max_tokens: 2000
    }
  }
  ```

### 2.3 保存预设
- **Action**: `saveCustomPreset(name, config)`
- **描述**: 将当前配置保存为命名预设，持久化存储于 LocalStorage。

## 3. 环境变量配置 (系统模式)

系统模式下，API 密钥不通过前端传递，而是直接从后端/构建环境读取。

- **环境变量**: `ZHIPU_API_KEY`
- **描述**: 智谱 AI 的 API 密钥。
- **验证**: 系统启动时会验证密钥格式及有效性。

## 错误码说明

| 错误码 | 描述 | 解决方案 |
|Data Type|Description|Solution|
|---|---|---|
| `INVALID_API_KEY` | API 密钥无效或格式错误 | 检查环境变量或自定义配置中的密钥 |
| `NETWORK_ERROR` | 网络连接失败 | 检查网络连接或 API Base URL 是否可达 |
| `TIMEOUT` | 请求超时 | 重试或检查网络状况 |
| `MODEL_NOT_FOUND` | 指定的模型 ID 不存在 | 检查模型 ID 是否正确 |
