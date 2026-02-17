# API密钥管理文档

## 目录

1. [概述](#概述)
2. [保密机制](#保密机制)
3. [配置说明](#配置说明)
4. [使用方法](#使用方法)
5. [密钥管理](#密钥管理)
6. [安全建议](#安全建议)
7. [常见问题](#常见问题)

## 概述

本项目的API密钥管理系统提供了完善的密钥保护机制，确保用户API密钥的安全性和隐私性。系统支持多个API提供商，并实现了密钥的隐藏显示和自动切换功能。

### 核心特性

- **密钥保密**：自动隐藏API密钥的敏感部分
- **默认API**：用户未配置密钥时，自动使用"我的API"
- **多提供商支持**：支持OpenRouter、Cherry、Ollama、七牛云AI
- **密钥验证**：自动验证密钥格式和有效性
- **灵活配置**：支持动态更新和切换密钥

## 保密机制

### 密钥隐藏显示

系统会在显示API密钥时自动隐藏敏感信息：

```javascript
// 示例1：完整密钥
原始密钥: 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
显示密钥: sk-or-****9d03

// 示例2：短密钥
原始密钥: abc12345
显示密钥: ****

// 示例3：默认密钥
原始密钥: my-api-key
显示密钥: 我的API（已隐藏）
```

### 默认API切换

当用户未配置自己的API密钥时，系统会自动使用"我的API"（实际密钥已隐藏）：

```javascript
// 检测用户是否配置了自己的API
const userApiKey = envConfig.get('OPENROUTER_API_KEY', '');
const useDefaultApi = !userApiKey || userApiKey === 'your-api-key-here';

// 如果未配置，使用"我的API"
const apiKey = useDefaultApi ? 'my-api-key' : userApiKey;
```

### 支持的API提供商

| API提供商 | 默认密钥标识 | 配置键名 | 用途 |
|-----------|-------------|---------|------|
| OpenRouter | `your-api-key-here` | `OPENROUTER_API_KEY` | 通用大模型 |
| Cherry | `your-api-key-here` | `CHERRY_API_KEY` | DeepSeek模型 |
| Ollama | `http://localhost:11434/api` | `OLLAMA_API_URL` | 本地模型 |
| 七牛云AI | `your-ai-api-key-here` | `QINIU_AI_API_KEY` | 七牛云模型 |

## 配置说明

### 环境变量配置

在 `.env` 文件中配置API密钥：

```env
# OpenRouter API配置
# 如果不配置，将使用"我的API"（隐藏实际密钥）
OPENROUTER_API_KEY=your-api-key-here
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions

# Cherry API配置（可选）
# 如果不配置，将使用"我的API"（隐藏实际密钥）
CHERRY_API_KEY=your-api-key-here
CHERRY_API_URL=https://api.cherry.ai/v1/chat/completions

# Ollama API配置（本地）
OLLAMA_API_URL=http://localhost:11434/api

# 七牛云AI模型配置（可选）
# 如果不配置，将使用"我的API"（隐藏实际密钥）
QINIU_AI_API_KEY=your-ai-api-key-here
QINIU_AI_API_URL=https://ai.qiniu.com/v1
QINIU_AI_ORGANIZATION=your-organization-id
QINIU_AI_PROJECT=your-project-id
```

### 配置说明

1. **默认API密钥**：当值为 `your-api-key-here`、`your-ai-api-key-here` 等时，系统会使用"我的API"
2. **用户API密钥**：填入您自己的API密钥，系统会使用您的密钥
3. **空值**：留空或不填，等同于使用默认API

## 使用方法

### 方法1：通过环境变量配置

**步骤：**

1. 打开项目根目录的 `.env` 文件
2. 找到对应的API提供商配置项
3. 将 `your-api-key-here` 替换为您的实际API密钥
4. 保存文件
5. 重启应用

**示例：**

```env
# 配置OpenRouter API密钥
OPENROUTER_API_KEY=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
```

### 方法2：通过密钥管理器配置

使用密钥管理模块进行更灵活的配置：

```javascript
import apiKeyManager from './src/config/apiKeyManager.js';

// 设置OpenRouter API密钥
apiKeyManager.setApiKey('openrouter', 'sk-or-v1-your-actual-key');

// 设置Cherry API密钥
apiKeyManager.setApiKey('cherry', 'your-cherry-api-key');

// 设置七牛云AI API密钥
apiKeyManager.setApiKey('qiniu-ai', 'your-qiniu-api-key');

// 获取密钥（带保密逻辑）
const openRouterKey = apiKeyManager.getOpenRouterApiKey();
const cherryKey = apiKeyManager.getCherryApiKey();
const qiniuKey = apiKeyManager.getQiniuAIApiKey();

// 检查是否使用默认API
const isDefault = apiKeyManager.isUsingDefaultApiKey();
console.log('是否使用默认API:', isDefault);
```

### 方法3：运行时动态配置

在应用运行时动态更新API密钥：

```javascript
import envConfig from './src/config/env.js';

// 更新OpenRouter API密钥
envConfig.set('OPENROUTER_API_KEY', 'your-new-api-key');

// 更新Cherry API密钥
envConfig.set('CHERRY_API_KEY', 'your-new-cherry-key');

// 更新七牛云AI API密钥
envConfig.set('QINIU_AI_API_KEY', 'your-new-qiniu-key');
```

## 密钥管理

### 密钥管理器功能

密钥管理器（`apiKeyManager`）提供以下功能：

#### 1. 设置密钥

```javascript
apiKeyManager.setApiKey(provider, apiKey);
```

**参数：**
- `provider` (string): API提供商（`openrouter`、`cherry`、`qiniu-ai`、`ollama-url`）
- `apiKey` (string): API密钥

#### 2. 获取密钥

```javascript
apiKeyManager.getApiKey(provider);
```

**参数：**
- `provider` (string): API提供商

**返回值：** API密钥字符串

#### 3. 删除密钥

```javascript
apiKeyManager.deleteApiKey(provider);
```

#### 4. 检查密钥是否存在

```javascript
apiKeyManager.hasApiKey(provider);
```

**返回值：** boolean

#### 5. 隐藏密钥显示

```javascript
apiKeyManager.maskApiKey(apiKey, visibleChars);
```

**参数：**
- `apiKey` (string): API密钥
- `visibleChars` (number): 可见字符数（默认4）

**返回值：** 隐藏后的密钥

#### 6. 获取提供商专用密钥

```javascript
// OpenRouter API密钥
const openRouterKey = apiKeyManager.getOpenRouterApiKey();

// Cherry API密钥
const cherryKey = apiKeyManager.getCherryApiKey();

// 七牛云AI API密钥
const qiniuKey = apiKeyManager.getQiniuAIApiKey();

// Ollama API URL
const ollamaUrl = apiKeyManager.getOllamaApiUrl();
```

#### 7. 验证密钥格式

```javascript
const validation = apiKeyManager.validateApiKeyFormat('openrouter', 'sk-or-v1-xxx');
console.log('是否有效:', validation.valid);
console.log('错误:', validation.errors);
console.log('警告:', validation.warnings);
```

#### 8. 获取显示信息

```javascript
const displayInfo = apiKeyManager.getDisplayInfo();
console.log('显示信息:', displayInfo);
```

**返回值：**

```javascript
{
  openrouter: {
    hasKey: true,
    maskedKey: 'sk-or-****1234',
    isDefault: false
  },
  cherry: {
    hasKey: true,
    maskedKey: '****',
    isDefault: false
  },
  qiniu: {
    hasKey: false,
    maskedKey: '我的API（已隐藏）',
    isDefault: true
  },
  ollama: {
    hasKey: true,
    maskedKey: 'http://localhost:11434/api',
    isDefault: false
  },
  isUsingDefault: true
}
```

#### 9. 导出/导入密钥

```javascript
// 导出密钥（加密）
apiKeyManager.exportKeys('./my-api-keys.json');

// 导入密钥（解密）
apiKeyManager.importKeys('./my-api-keys.json');

// 清空所有密钥
apiKeyManager.clearAllKeys();
```

#### 10. 获取统计信息

```javascript
const stats = apiKeyManager.getStats();
console.log('统计信息:', stats);
```

**返回值：**

```javascript
{
  totalProviders: 4,
  configuredProviders: 3,
  unconfiguredProviders: 1,
  isUsingDefault: true,
  providers: [
    { name: 'openrouter', configured: true, maskedKey: 'sk-or-****1234' },
    { name: 'cherry', configured: true, maskedKey: '****' },
    { name: 'qiniu-ai', configured: false, maskedKey: '我的API（已隐藏）' },
    { name: 'ollama-url', configured: true, maskedKey: 'http://localhost:11434/api' }
  ]
}
```

## 安全建议

### 1. 密钥保护

- ✅ **不要将密钥提交到版本控制系统**（Git、SVN等）
- ✅ **使用环境变量或配置文件**（`.env` 文件）
- ✅ **将 `.env` 文件添加到 `.gitignore`**
- ✅ **定期更换API密钥**
- ✅ **为不同的环境使用不同的密钥**（开发、测试、生产）

### 2. 访问控制

- ✅ **限制API密钥的访问权限**
- ✅ **使用最小权限原则**
- ✅ **定期审查API密钥使用情况**
- ✅ **监控异常API调用**

### 3. 存储安全

- ✅ **加密存储敏感信息**
- ✅ **使用安全的存储位置**
- ✅ **定期备份配置文件**
- ✅ **避免在日志中记录完整密钥**

### 4. 传输安全

- ✅ **使用HTTPS协议**
- ✅ **验证SSL证书**
- ✅ **避免在不安全的网络环境中使用密钥**

## 常见问题

### Q1: 如何知道当前使用的是默认API还是自己的API？

**A:** 使用以下方法检查：

```javascript
import envConfig from './src/config/env.js';

const isDefault = envConfig.isUsingDefaultApiKey();
console.log('是否使用默认API:', isDefault);
```

如果返回 `true`，说明使用的是默认API（"我的API"）；如果返回 `false`，说明使用的是您配置的API密钥。

### Q2: 如何临时切换到默认API？

**A:** 将 `.env` 文件中的API密钥设置为默认值：

```env
# 设置为默认值
OPENROUTER_API_KEY=your-api-key-here
CHERRY_API_KEY=your-api-key-here
QINIU_AI_API_KEY=your-ai-api-key-here
```

### Q3: 密钥显示时为什么只显示部分内容？

**A:** 这是出于安全考虑，防止密钥被意外泄露。系统会保留密钥的前4个字符和后4个字符，中间部分用 `****` 替代。

### Q4: 如何验证我的API密钥是否有效？

**A:** 使用密钥管理器的验证功能：

```javascript
import apiKeyManager from './src/config/apiKeyManager.js';

const validation = apiKeyManager.validateApiKeyFormat('openrouter', 'your-api-key');
console.log('验证结果:', validation);
```

### Q5: 如何在代码中获取隐藏后的密钥用于显示？

**A:** 使用环境配置的隐藏方法：

```javascript
import envConfig from './src/config/env.js';

const apiKey = envConfig.getApiKeyWithFallback();
const maskedKey = envConfig.maskApiKey(apiKey);
console.log('密钥:', maskedKey);
```

### Q6: 可以同时使用多个API提供商的密钥吗？

**A:** 可以！系统支持同时配置多个API提供商的密钥：

```env
# OpenRouter API密钥
OPENROUTER_API_KEY=sk-or-v1-your-key

# Cherry API密钥
CHERRY_API_KEY=your-cherry-key

# 七牛云AI API密钥
QINIU_AI_API_KEY=your-qiniu-key

# Ollama API URL
OLLAMA_API_URL=http://localhost:11434/api
```

系统会根据选择的模型自动路由到对应的API提供商。

### Q7: 如何确保密钥不被意外提交到Git？

**A:** 确保 `.env` 文件在 `.gitignore` 中：

```gitignore
# 环境变量文件
.env
.env.local
.env.*.local

# 密钥存储文件
.api-keys
*.key
```

### Q8: 默认API的密钥是什么？实际密钥如何获取？

**A:** 默认API的密钥是 `"my-api-key"`，这是一个占位符。实际使用的密钥由项目维护者提供，并通过代码逻辑隐藏。用户无法直接看到实际密钥，这确保了密钥的保密性。

### Q9: 如何在生产环境中配置API密钥？

**A:** 在生产环境中，建议：

1. 使用环境变量而非配置文件
2. 通过CI/CD系统的Secrets管理功能
3. 使用专业的密钥管理服务（如AWS Secrets Manager、HashiCorp Vault）
4. 定期轮换API密钥

### Q10: 如果API密钥泄露了怎么办？

**A:** 立即采取以下措施：

1. **立即撤销泄露的密钥**：在对应的API提供商控制台撤销
2. **生成新的API密钥**：在控制台创建新密钥
3. **更新配置**：将新密钥配置到应用中
4. **检查使用日志**：确认泄露的密钥是否被滥用
5. **通知相关人员**：告知团队密钥泄露情况

## 相关资源

- [OpenRouter API文档](https://openrouter.ai/docs)
- [Cherry API文档](https://api.cherry.ai/docs)
- [七牛云AI平台](https://ai.qiniu.com/)
- [Ollama文档](https://ollama.com/docs)

## 更新日志

### v1.0.0 (2025-01-15)

- 初始版本发布
- 实现密钥隐藏显示功能
- 实现默认API切换机制
- 支持多个API提供商
- 添加密钥验证功能
- 添加密钥管理器模块
- 添加完整文档

## 许可证

MIT License

## 支持

如有问题或建议，请通过以下方式联系：

- 提交Issue
- 发送邮件
- 查看项目文档
