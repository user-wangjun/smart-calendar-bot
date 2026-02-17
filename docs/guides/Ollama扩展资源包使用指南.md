# Ollama 扩展资源包使用指南

## 📋 概述

Ollama 扩展资源包是一个智能的模型管理系统，提供以下功能：

- ✅ **设备检测** - 自动检测用户设备的硬件配置
- ✅ **兼容性检查** - 在下载前检查模型是否兼容
- ✅ **智能提示** - 提供详细的警告和建议
- ✅ **模型管理** - 统一管理所有 Ollama 模型
- ✅ **进度跟踪** - 实时显示下载进度
- ✅ **通知系统** - 集中管理所有通知

---

## 🚀 快速开始

### 1. 安装 Ollama

```bash
# Windows
iwr -useb get-ollama.com | iex

# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh
```

### 2. 基本使用

```javascript
import OllamaExtensionManager from './src/extensions/ollamaExtensionManager.js';

const manager = new OllamaExtensionManager();

// 获取设备信息
const deviceInfo = await manager.getDeviceInfo();
console.log(deviceInfo);

// 检查模型兼容性
const compatibility = await manager.checkCompatibility('llama3.1');
console.log(compatibility);

// 下载模型
await manager.downloadModel('llama3.1', (progress) => {
  console.log(progress);
});
```

---

## 📊 设备检测

### 检测内容

| 检测项 | 说明 |
|--------|------|
| **平台** | 操作系统（Windows/macOS/Linux） |
| **架构** | CPU 架构（x64/arm64） |
| **总内存** | 系统总内存（GB） |
| **可用内存** | 当前可用内存（GB） |
| **已用内存** | 当前已用内存（GB） |
| **CPU 核心数** | CPU 核心数量 |
| **CPU 型号** | CPU 型号信息 |
| **GPU 信息** | GPU 名称和显存（GB） |

### 使用示例

```javascript
const manager = new OllamaExtensionManager();
const deviceInfo = await manager.getDeviceInfo();

console.log('设备信息:');
console.log(`平台: ${deviceInfo.platform}`);
console.log(`总内存: ${deviceInfo.totalRam}GB`);
console.log(`CPU 核心数: ${deviceInfo.cpuCores}`);
console.log(`GPU: ${deviceInfo.gpu?.name || '未检测到'}`);
```

---

## 🔍 兼容性检查

### 检查项目

| 检查项 | 说明 |
|--------|------|
| **内存检查** | 检查总内存和可用内存是否满足要求 |
| **GPU 检查** | 检查显存是否满足要求 |
| **CPU 检查** | 检查 CPU 核心数是否满足要求 |
| **磁盘检查** | 检查磁盘空间是否足够 |

### 兼容性结果

```javascript
const compatibility = await manager.checkCompatibility('llama3.1');

// 兼容性结果
{
  modelId: 'llama3.1',
  modelName: 'Llama 3.1 8B',
  compatible: true,  // 是否兼容
  errors: [],  // 错误列表（不兼容时）
  warnings: [],  // 警告列表
  recommendations: [],  // 推荐建议
  deviceInfo: {  // 设备信息
    platform: 'win32',
    totalRam: 16,
    freeRam: 8,
    cpuCores: 8,
    gpu: { name: 'NVIDIA RTX 3060', vram: 12 }
  },
  modelInfo: {  // 模型需求
    size: '4.7GB',
    minRam: 8,
    recommendedRam: 16,
    minVram: 4,
    recommendedVram: 8,
    cpuCores: 4,
    recommendedCores: 8
  }
}
```

### 使用示例

```javascript
const manager = new OllamaExtensionManager();

// 检查模型兼容性
const compatibility = await manager.checkCompatibility('llama3.1');

if (compatibility.compatible) {
  console.log('模型兼容！');
  
  if (compatibility.warnings.length > 0) {
    console.log('警告:');
    compatibility.warnings.forEach(warning => {
      console.log(`- ${warning}`);
    });
  }
  
  if (compatibility.recommendations.length > 0) {
    console.log('推荐:');
    compatibility.recommendations.forEach(rec => {
      console.log(`- ${rec}`);
    });
  }
} else {
  console.log('模型不兼容！');
  console.log('错误:');
  compatibility.errors.forEach(error => {
    console.log(`- ${error}`);
  });
}
```

---

## 📦 模型管理

### 获取所有可用模型

```javascript
const manager = new OllamaExtensionManager();
const allModels = manager.getAllModels();

allModels.forEach(model => {
  console.log(`${model.name} (${model.id})`);
  console.log(`大小: ${model.size}`);
  console.log(`描述: ${model.description}`);
});
```

### 获取推荐模型

```javascript
const manager = new OllamaExtensionManager();
const recommendedModels = manager.getRecommendedModels();

recommendedModels.forEach(model => {
  console.log(`${model.name} (${model.id})`);
  console.log(`大小: ${model.size}`);
  console.log(`描述: ${model.description}`);
});
```

### 获取已安装模型

```javascript
const manager = new OllamaExtensionManager();
const installedModels = await manager.getInstalledModels();

installedModels.forEach(model => {
  console.log(model);
});
```

### 检查模型是否已安装

```javascript
const manager = new OllamaExtensionManager();
const isInstalled = await manager.isModelInstalled('llama3.1');

console.log(`模型已安装: ${isInstalled}`);
```

---

## ⬇️ 模型下载

### 基本下载

```javascript
const manager = new OllamaExtensionManager();

await manager.downloadModel('llama3.1', (progress) => {
  console.log(progress);
});
```

### 带兼容性检查的下载

```javascript
const manager = new OllamaExtensionManager();

// 1. 检查兼容性
const compatibility = await manager.checkCompatibility('llama3.1');

if (!compatibility.compatible) {
  console.error('模型不兼容:', compatibility.errors);
  return;
}

// 2. 显示警告
if (compatibility.warnings.length > 0) {
  console.warn('兼容性警告:', compatibility.warnings);
}

// 3. 下载模型
await manager.downloadModel('llama3.1', (progress) => {
  console.log(progress);
});
```

### 下载进度处理

```javascript
const manager = new OllamaExtensionManager();

await manager.downloadModel('llama3.1', (progress) => {
  // Ollama 会输出下载进度
  console.log(progress);
  
  // 可以解析进度信息
  if (progress.includes('downloading')) {
    console.log('正在下载...');
  } else if (progress.includes('verifying')) {
    console.log('正在验证...');
  } else if (progress.includes('success')) {
    console.log('下载成功！');
  }
});
```

---

## 🔔 通知系统

### 获取通知

```javascript
const manager = new OllamaExtensionManager();

// 检查兼容性时会自动添加通知
await manager.checkCompatibility('llama3.1');

// 获取所有通知
const notifications = manager.getNotifications();

notifications.forEach(notification => {
  console.log(`[${notification.type}] ${notification.title}`);
  console.log(notification.message);
  
  if (notification.recommendations) {
    console.log('推荐:');
    notification.recommendations.forEach(rec => {
      console.log(`- ${rec}`);
    });
  }
});
```

### 清除通知

```javascript
const manager = new OllamaExtensionManager();

// 清除所有通知
manager.clearNotifications();
```

---

## 📋 可用模型列表

### 推荐模型

| 模型ID | 名称 | 大小 | 最小内存 | 推荐内存 | 最小显存 | 推荐显存 |
|---------|------|------|----------|----------|----------|----------|
| **llama3.1** | Llama 3.1 8B | 4.7GB | 8GB | 16GB | 4GB | 8GB |
| **qwen2.5:7b** | Qwen 2.5 7B | 4.5GB | 8GB | 16GB | 4GB | 8GB |
| **mistral:7b** | Mistral 7B | 4.1GB | 8GB | 16GB | 4GB | 8GB |
| **phi3:mini** | Phi-3 Mini | 2.3GB | 4GB | 8GB | 2GB | 4GB |
| **gemma2:9b** | Gemma 2 9B | 5.5GB | 8GB | 16GB | 4GB | 8GB |
| **llava-joycaption** | LLaVA JoyCaption | 约4GB | 8GB | 16GB | 4GB | 8GB |

### 专业模型

| 模型ID | 名称 | 大小 | 最小内存 | 推荐内存 | 最小显存 | 推荐显存 |
|---------|------|------|----------|----------|----------|----------|
| **llama3.1:70b** | Llama 3.1 70B | 40GB | 32GB | 64GB | 16GB | 32GB |
| **qwen2.5:14b** | Qwen 2.5 14B | 9GB | 16GB | 32GB | 8GB | 16GB |
| **mixtral:8x7b** | Mixtral 8x7B | 26GB | 24GB | 48GB | 12GB | 24GB |
| **deepseek-coder-v2** | DeepSeek Coder V2 | 9GB | 16GB | 32GB | 8GB | 16GB |
| **codellama:13b** | CodeLlama 13B | 7.4GB | 12GB | 24GB | 6GB | 12GB |

---

## 💡 使用场景

### 场景1：首次使用

```javascript
const manager = new OllamaExtensionManager();

// 1. 获取设备信息
const deviceInfo = await manager.getDeviceInfo();
console.log('设备信息:', deviceInfo);

// 2. 获取推荐模型
const recommendedModels = manager.getRecommendedModels();
console.log('推荐模型:', recommendedModels);

// 3. 选择第一个推荐模型
const firstModel = recommendedModels[0];

// 4. 检查兼容性
const compatibility = await manager.checkCompatibility(firstModel.id);

if (compatibility.compatible) {
  // 5. 下载模型
  await manager.downloadModel(firstModel.id, (progress) => {
    console.log(progress);
  });
  
  console.log('下载完成！');
} else {
  console.error('模型不兼容:', compatibility.errors);
}
```

### 场景2：检查多个模型兼容性

```javascript
const manager = new OllamaExtensionManager();

const modelsToCheck = ['llama3.1', 'qwen2.5:7b', 'phi3:mini'];

for (const modelId of modelsToCheck) {
  const compatibility = await manager.checkCompatibility(modelId);
  
  console.log(`${OLLAMA_MODELS[modelId].name}:`);
  console.log(`  兼容: ${compatibility.compatible ? '是' : '否'}`);
  
  if (compatibility.warnings.length > 0) {
    console.log(`  警告: ${compatibility.warnings.join(', ')}`);
  }
  
  console.log('');
}
```

### 场景3：智能模型推荐

```javascript
const manager = new OllamaExtensionManager();

// 获取设备信息
const deviceInfo = await manager.getDeviceInfo();

// 获取所有模型
const allModels = manager.getAllModels();

// 筛选兼容的模型
const compatibleModels = [];

for (const model of allModels) {
  const compatibility = await manager.checkCompatibility(model.id);
  
  if (compatibility.compatible) {
    compatibleModels.push({
      model,
      compatibility
    });
  }
}

// 按推荐度排序
compatibleModels.sort((a, b) => {
  if (a.model.recommended && !b.model.recommended) return -1;
  if (!a.model.recommended && b.model.recommended) return 1;
  return 0;
});

// 显示推荐模型
console.log('推荐的兼容模型:');
compatibleModels.slice(0, 3).forEach(({ model, compatibility }) => {
  console.log(`${model.name} (${model.id})`);
  console.log(`  大小: ${model.size}`);
  console.log(`  描述: ${model.description}`);
  
  if (compatibility.warnings.length > 0) {
    console.log(`  警告: ${compatibility.warnings.join(', ')}`);
  }
  
  console.log('');
});
```

---

## 🛡️ 错误处理

### 常见错误

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| `未知模型: xxx` | 模型ID不存在 | 检查模型ID是否正确 |
| `内存不足` | 设备内存不够 | 关闭其他应用或使用更小的模型 |
| `显存不足` | GPU显存不够 | 使用CPU运行或使用更小的模型 |
| `CPU核心数不足` | CPU核心数不够 | 使用更小的模型 |
| `磁盘空间不足` | 磁盘空间不够 | 清理磁盘空间 |

### 错误处理示例

```javascript
const manager = new OllamaExtensionManager();

try {
  // 检查兼容性
  const compatibility = await manager.checkCompatibility('llama3.1');
  
  if (!compatibility.compatible) {
    console.error('模型不兼容:');
    compatibility.errors.forEach(error => {
      console.error(`- ${error}`);
    });
    
    // 提供解决方案
    console.log('\n建议:');
    compatibility.recommendations.forEach(rec => {
      console.log(`- ${rec}`);
    });
    
    return;
  }
  
  // 下载模型
  await manager.downloadModel('llama3.1', (progress) => {
    console.log(progress);
  });
  
  console.log('下载成功！');
  
} catch (error) {
  console.error('发生错误:', error.message);
  
  // 获取通知以获取更多信息
  const notifications = manager.getNotifications();
  notifications.forEach(notification => {
    console.log(`[${notification.type}] ${notification.title}`);
    console.log(notification.message);
  });
}
```

---

## 📊 性能优化建议

### 基于设备配置的推荐

#### 低配置设备（< 8GB 内存）

```javascript
// 推荐模型：Phi-3 Mini
const modelId = 'phi3:mini';

await manager.downloadModel(modelId, (progress) => {
  console.log(progress);
});
```

#### 中等配置设备（8-16GB 内存）

```javascript
// 推荐模型：Mistral 7B 或 Qwen 2.5 7B
const modelId = 'qwen2.5:7b';

await manager.downloadModel(modelId, (progress) => {
  console.log(progress);
});
```

#### 高配置设备（> 16GB 内存）

```javascript
// 推荐模型：Llama 3.1 8B 或 Llama 3.1 70B
const modelId = 'llama3.1';

await manager.downloadModel(modelId, (progress) => {
  console.log(progress);
});
```

---

## 🎯 最佳实践

### 1. 下载前检查兼容性

```javascript
const manager = new OllamaExtensionManager();

// 始终在下载前检查兼容性
const compatibility = await manager.checkCompatibility(modelId);

if (!compatibility.compatible) {
  console.error('模型不兼容，无法下载');
  return;
}

// 检查警告
if (compatibility.warnings.length > 0) {
  console.warn('兼容性警告:', compatibility.warnings);
  
  // 显示推荐
  if (compatibility.recommendations.length > 0) {
    console.log('推荐:', compatibility.recommendations);
  }
}

// 下载模型
await manager.downloadModel(modelId, (progress) => {
  console.log(progress);
});
```

### 2. 监听通知

```javascript
const manager = new OllamaExtensionManager();

// 检查兼容性
await manager.checkCompatibility('llama3.1');

// 获取通知
const notifications = manager.getNotifications();

// 处理通知
notifications.forEach(notification => {
  switch (notification.type) {
    case 'error':
      console.error(`错误: ${notification.message}`);
      break;
    case 'warning':
      console.warn(`警告: ${notification.message}`);
      break;
    case 'info':
      console.log(`信息: ${notification.message}`);
      break;
  }
  
  // 显示推荐
  if (notification.recommendations) {
    console.log('推荐:', notification.recommendations);
  }
});
```

### 3. 生成兼容性报告

```javascript
const manager = new OllamaExtensionManager();

// 生成兼容性报告
const report = await manager.generateCompatibilityReport('llama3.1');

// 导出为JSON
await manager.exportCompatibilityReport('llama3.1', './compatibility-report.json');

console.log('兼容性报告已导出');
```

---

## 📝 API 参考

### OllamaExtensionManager

#### 构造函数

```javascript
new OllamaExtensionManager(options)
```

**参数**：
- `options.ollamaPath` - Ollama 可执行文件路径（默认: 'ollama'）
- `options.modelsPath` - 模型存储路径（默认: `~/.ollama/models`）

#### 方法

##### `checkOllamaInstalled()`

检查 Ollama 是否已安装。

**返回**：`Promise<boolean>`

##### `getInstalledModels()`

获取已安装的模型列表。

**返回**：`Promise<string[]>`

##### `isModelInstalled(modelId)`

检查模型是否已安装。

**参数**：
- `modelId` - 模型ID

**返回**：`Promise<boolean>`

##### `checkCompatibility(modelId)`

检查模型兼容性。

**参数**：
- `modelId` - 模型ID

**返回**：`Promise<Object>` - 兼容性结果

##### `downloadModel(modelId, onProgress)`

下载模型。

**参数**：
- `modelId` - 模型ID
- `onProgress` - 进度回调函数

**返回**：`Promise<Object>` - 下载结果

##### `deleteModel(modelId)`

删除模型。

**参数**：
- `modelId` - 模型ID

**返回**：`Promise<Object>` - 删除结果

##### `getAllModels()`

获取所有可用模型。

**返回**：`Array<Object>`

##### `getRecommendedModels()`

获取推荐模型。

**返回**：`Array<Object>`

##### `getDeviceInfo()`

获取设备信息。

**返回**：`Promise<Object>`

##### `generateCompatibilityReport(modelId)`

生成兼容性报告。

**参数**：
- `modelId` - 模型ID

**返回**：`Promise<Object>` - 兼容性报告

##### `exportCompatibilityReport(modelId, filePath)`

导出兼容性报告为JSON。

**参数**：
- `modelId` - 模型ID
- `filePath` - 文件路径

**返回**：`Promise<Object>` - 兼容性报告

---

## 🎉 总结

### 核心功能

1. ✅ **设备检测** - 自动检测硬件配置
2. ✅ **兼容性检查** - 下载前检查模型是否兼容
3. ✅ **智能提示** - 提供详细的警告和建议
4. ✅ **模型管理** - 统一管理所有 Ollama 模型
5. ✅ **进度跟踪** - 实时显示下载进度
6. ✅ **通知系统** - 集中管理所有通知

### 使用流程

```
1. 获取设备信息
   ↓
2. 选择模型
   ↓
3. 检查兼容性
   ↓
4. 查看警告和建议
   ↓
5. 下载模型
   ↓
6. 监听进度
   ↓
7. 完成下载
```

### 优势

- 🛡️ **安全** - 下载前检查兼容性，避免下载不兼容的模型
- 💡 **智能** - 自动检测设备配置，提供个性化推荐
- 📊 **透明** - 详细的兼容性报告和警告信息
- 🔔 **通知** - 集中管理所有通知，不会遗漏重要信息
- 🚀 **高效** - 优化的下载流程，节省时间

---

**文档版本**：v1.0  
**创建日期**：2026年1月14日  
**维护人**：开发团队

**🎉 重要提示**：使用 Ollama 扩展资源包可以安全、智能地管理所有 Ollama 模型！
