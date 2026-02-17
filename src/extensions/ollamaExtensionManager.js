/**
 * Ollama 拓展资源包管理器
 * 负责管理 Ollama 模型的下载、安装和设备检测
 * 支持浏览器环境（模拟功能）和Node.js环境（完整功能）
 */

// 环境检测
const isBrowser = typeof window !== 'undefined';

// 根据环境动态导入模块
// eslint-disable-next-line camelcase
let os, child_process, fs, path, execSync, exec, join, homedir, writeFileSync;

if (!isBrowser) {
  try {
    os = require('os');
    // eslint-disable-next-line camelcase
    child_process = require('child_process');
    fs = require('fs');
    path = require('path');
    // eslint-disable-next-line camelcase
    execSync = child_process.execSync;
    // eslint-disable-next-line camelcase
    exec = child_process.exec;
    join = path.join;
    homedir = os.homedir;
    writeFileSync = fs.writeFileSync;
  } catch (error) {
    console.error('Node.js模块加载失败:', error.message);
  }
}

/**
 * Ollama 模型信息
 */
const OLLAMA_MODELS = {
  'llama3.1': {
    name: 'Llama 3.1 8B',
    description: 'Meta Llama 3.1 8B模型，适合通用对话和复杂任务',
    size: '4.7GB',
    sizeBytes: 4.7 * 1024 * 1024 * 1024,
    contextLength: 128000,
    recommended: true,
    minRam: 8, // 最小内存需求（GB）
    recommendedRam: 16, // 推荐内存（GB）
    minVram: 4, // 最小显存需求（GB）
    recommendedVram: 8, // 推荐显存（GB）
    cpuCores: 4, // 最小CPU核心数
    recommendedCores: 8 // 推荐CPU核心数
  },
  'qwen2.5:7b': {
    name: 'Qwen 2.5 7B',
    description: '通义千问2.5 7B模型，适合中文对话和文本生成',
    size: '4.5GB',
    sizeBytes: 4.5 * 1024 * 1024 * 1024,
    contextLength: 32768,
    recommended: true,
    minRam: 8,
    recommendedRam: 16,
    minVram: 4,
    recommendedVram: 8,
    cpuCores: 4,
    recommendedCores: 8
  },
  'mistral:7b': {
    name: 'Mistral 7B',
    description: 'Mistral AI 7B模型，适合快速推理和通用对话',
    size: '4.1GB',
    sizeBytes: 4.1 * 1024 * 1024 * 1024,
    contextLength: 32768,
    recommended: true,
    minRam: 8,
    recommendedRam: 16,
    minVram: 4,
    recommendedVram: 8,
    cpuCores: 4,
    recommendedCores: 8
  },
  'phi3:mini': {
    name: 'Phi-3 Mini',
    description: 'Microsoft Phi-3 Mini 3.8B模型，适合快速推理和边缘设备',
    size: '2.3GB',
    sizeBytes: 2.3 * 1024 * 1024 * 1024,
    contextLength: 128000,
    recommended: true,
    minRam: 4,
    recommendedRam: 8,
    minVram: 2,
    recommendedVram: 4,
    cpuCores: 2,
    recommendedCores: 4
  },
  'gemma2:9b': {
    name: 'Gemma 2 9B',
    description: 'Google Gemma 2 9B模型，适合通用对话和推理',
    size: '5.5GB',
    sizeBytes: 5.5 * 1024 * 1024 * 1024,
    contextLength: 8192,
    recommended: true,
    minRam: 8,
    recommendedRam: 16,
    minVram: 4,
    recommendedVram: 8,
    cpuCores: 4,
    recommendedCores: 8
  },
  'llama3.1:70b': {
    name: 'Llama 3.1 70B',
    description: 'Meta Llama 3.1 70B模型，适合复杂推理和高质量对话',
    size: '40GB',
    sizeBytes: 40 * 1024 * 1024 * 1024,
    contextLength: 128000,
    recommended: false,
    minRam: 32,
    recommendedRam: 64,
    minVram: 16,
    recommendedVram: 32,
    cpuCores: 8,
    recommendedCores: 16
  },
  'qwen2.5:14b': {
    name: 'Qwen 2.5 14B',
    description: '通义千问2.5 14B模型，适合复杂任务和多轮对话',
    size: '9GB',
    sizeBytes: 9 * 1024 * 1024 * 1024,
    contextLength: 32768,
    recommended: false,
    minRam: 16,
    recommendedRam: 32,
    minVram: 8,
    recommendedVram: 16,
    cpuCores: 6,
    recommendedCores: 12
  },
  'mixtral:8x7b': {
    name: 'Mixtral 8x7B',
    description: 'Mistral AI Mixtral 8x7B模型，适合复杂推理和高质量输出',
    size: '26GB',
    sizeBytes: 26 * 1024 * 1024 * 1024,
    contextLength: 32768,
    recommended: false,
    minRam: 24,
    recommendedRam: 48,
    minVram: 12,
    recommendedVram: 24,
    cpuCores: 8,
    recommendedCores: 16
  },
  'deepseek-coder-v2': {
    name: 'DeepSeek Coder V2',
    description: 'DeepSeek Coder V2 16B模型，专门用于代码生成和编程辅助',
    size: '9GB',
    sizeBytes: 9 * 1024 * 1024 * 1024,
    contextLength: 16384,
    recommended: false,
    minRam: 16,
    recommendedRam: 32,
    minVram: 8,
    recommendedVram: 16,
    cpuCores: 6,
    recommendedCores: 12
  },
  'codellama:13b': {
    name: 'CodeLlama 13B',
    description: 'Meta CodeLlama 13B模型，专门用于代码生成和编程辅助',
    size: '7.4GB',
    sizeBytes: 7.4 * 1024 * 1024 * 1024,
    contextLength: 16384,
    recommended: false,
    minRam: 12,
    recommendedRam: 24,
    minVram: 6,
    recommendedVram: 12,
    cpuCores: 6,
    recommendedCores: 12
  },
  'aha2025/llava-joycaption-beta-one-hf-llava:Q4_K_M': {
    name: 'LLaVA JoyCaption Beta',
    description: 'LLaVA多模态模型，支持图像理解和描述生成',
    size: '约4GB',
    sizeBytes: 4 * 1024 * 1024 * 1024,
    contextLength: 4096,
    recommended: true,
    minRam: 8,
    recommendedRam: 16,
    minVram: 4,
    recommendedVram: 8,
    cpuCores: 4,
    recommendedCores: 8,
    supportsImages: true
  }
};

/**
 * 设备信息类
 */
class DeviceInfo {
  constructor () {
    this.platform = isBrowser ? 'browser' : os.platform();
    this.arch = isBrowser ? 'browser' : os.arch();
    this.totalRam = isBrowser ? 8 * 1024 * 1024 * 1024 : os.totalmem();
    this.freeRam = isBrowser ? 4 * 1024 * 1024 * 1024 : os.freemem();
    this.cpus = isBrowser ? [{ model: 'Unknown' }] : os.cpus();
    this.cpuCores = this.cpus.length;
    this.cpuModel = this.cpus[0]?.model || 'Unknown';
    this.gpuInfo = null;
  }

  /**
   * 获取总内存（GB）
   */
  getTotalRamGB () {
    return Math.round(this.totalRam / (1024 * 1024 * 1024) * 100) / 100;
  }

  /**
   * 获取可用内存（GB）
   */
  getFreeRamGB () {
    return Math.round(this.freeRam / (1024 * 1024 * 1024) * 100) / 100;
  }

  /**
   * 获取已用内存（GB）
   */
  getUsedRamGB () {
    return Math.round((this.totalRam - this.freeRam) / (1024 * 1024 * 1024) * 100) / 100;
  }

  /**
   * 检测GPU信息
   */
  async detectGPU () {
    try {
      if (this.platform === 'win32') {
        const result = execSync('wmic path win32_VideoController get name,AdapterRAM', { encoding: 'utf8' });
        this.gpuInfo = this.parseWindowsGPU(result);
      } else if (this.platform === 'darwin') {
        const result = execSync('system_profiler SPDisplaysDataType | grep "Chipset Model"', { encoding: 'utf8' });
        this.gpuInfo = this.parseMacGPU(result);
      } else if (this.platform === 'linux') {
        const result = execSync('lspci | grep -i vga', { encoding: 'utf8' });
        this.gpuInfo = this.parseLinuxGPU(result);
      }
    } catch (error) {
      console.warn('无法检测GPU信息:', error.message);
      this.gpuInfo = { name: 'Unknown', vram: 0 };
    }

    return this.gpuInfo;
  }

  /**
   * 解析Windows GPU信息
   */
  parseWindowsGPU (output) {
    const lines = output.split('\n').filter(line => line.trim());
    const gpus = [];

    for (const line of lines) {
      const match = line.match(/(.+?)\s+(\d+)/);
      if (match) {
        gpus.push({
          name: match[1].trim(),
          vram: parseInt(match[2]) / (1024 * 1024) // 转换为GB
        });
      }
    }

    return gpus.length > 0 ? gpus[0] : { name: 'Unknown', vram: 0 };
  }

  /**
   * 解析Mac GPU信息
   */
  parseMacGPU (output) {
    const match = output.match(/Chipset Model:\s*(.+)/);
    if (match) {
      return { name: match[1].trim(), vram: 0 };
    }
    return { name: 'Unknown', vram: 0 };
  }

  /**
   * 解析Linux GPU信息
   */
  parseLinuxGPU (output) {
    const match = output.match(/(.+?)\s*\[.*?\]/);
    if (match) {
      return { name: match[1].trim(), vram: 0 };
    }
    return { name: 'Unknown', vram: 0 };
  }

  /**
   * 获取设备信息摘要
   */
  getSummary () {
    return {
      platform: this.platform,
      arch: this.arch,
      totalRam: this.getTotalRamGB(),
      freeRam: this.getFreeRamGB(),
      usedRam: this.getUsedRamGB(),
      cpuCores: this.cpuCores,
      cpuModel: this.cpuModel,
      gpu: this.gpuInfo
    };
  }
}

/**
 * 兼容性检查结果
 */
class CompatibilityCheck {
  constructor (modelId, deviceInfo) {
    this.modelId = modelId;
    this.model = OLLAMA_MODELS[modelId];
    this.deviceInfo = deviceInfo;
    this.compatible = true;
    this.warnings = [];
    this.errors = [];
    this.recommendations = [];
  }

  /**
   * 检查内存兼容性
   */
  checkMemory () {
    const totalRam = this.deviceInfo.getTotalRamGB();
    const freeRam = this.deviceInfo.getFreeRamGB();

    if (totalRam < this.model.minRam) {
      this.compatible = false;
      this.errors.push(`内存不足：需要至少 ${this.model.minRam}GB，当前只有 ${totalRam}GB`);
    } else if (totalRam < this.model.recommendedRam) {
      this.warnings.push(`内存低于推荐值：推荐 ${this.model.recommendedRam}GB，当前只有 ${totalRam}GB`);
    }

    if (freeRam < this.model.minRam) {
      this.warnings.push(`可用内存不足：需要至少 ${this.model.minRam}GB，当前只有 ${freeRam}GB 可用`);
    }

    return this;
  }

  /**
   * 检查GPU兼容性
   */
  checkGPU () {
    if (!this.deviceInfo.gpuInfo || this.deviceInfo.gpuInfo.vram === 0) {
      this.warnings.push('无法检测GPU信息，将使用CPU运行（速度较慢）');
      return this;
    }

    const vram = this.deviceInfo.gpuInfo.vram;

    if (vram < this.model.minVram) {
      this.warnings.push(`显存不足：需要至少 ${this.model.minVram}GB，当前只有 ${vram}GB`);
    } else if (vram < this.model.recommendedVram) {
      this.warnings.push(`显存低于推荐值：推荐 ${this.model.recommendedVram}GB，当前只有 ${vram}GB`);
    }

    return this;
  }

  /**
   * 检查CPU兼容性
   */
  checkCPU () {
    const cpuCores = this.deviceInfo.cpuCores;

    if (cpuCores < this.model.cpuCores) {
      this.compatible = false;
      this.errors.push(`CPU核心数不足：需要至少 ${this.model.cpuCores} 核，当前只有 ${cpuCores} 核`);
    } else if (cpuCores < this.model.recommendedCores) {
      this.warnings.push(`CPU核心数低于推荐值：推荐 ${this.model.recommendedCores} 核，当前只有 ${cpuCores} 核`);
    }

    return this;
  }

  /**
   * 检查磁盘空间
   */
  checkDiskSpace () {
    const requiredSpace = this.model.sizeBytes;
    const availableSpace = this.deviceInfo.freeRam; // 简化处理，实际应该检查磁盘空间

    if (availableSpace < requiredSpace) {
      this.compatible = false;
      this.errors.push(`磁盘空间不足：需要至少 ${this.model.size}，当前可用空间不足`);
    }

    return this;
  }

  /**
   * 生成推荐建议
   */
  generateRecommendations () {
    const totalRam = this.deviceInfo.getTotalRamGB();
    const cpuCores = this.deviceInfo.cpuCores;

    if (totalRam < this.model.recommendedRam) {
      this.recommendations.push('建议关闭其他应用程序以释放内存');
      this.recommendations.push('考虑使用更小的模型，如 Phi-3 Mini（2.3GB）');
    }

    if (cpuCores < this.model.recommendedCores) {
      this.recommendations.push('CPU性能可能不足，建议使用更小的模型');
    }

    if (!this.deviceInfo.gpuInfo || this.deviceInfo.gpuInfo.vram === 0) {
      this.recommendations.push('未检测到GPU，将使用CPU运行，速度较慢');
    }

    return this;
  }

  /**
   * 执行所有检查
   */
  async checkAll () {
    await this.deviceInfo.detectGPU();
    this.checkMemory();
    this.checkGPU();
    this.checkCPU();
    this.checkDiskSpace();
    this.generateRecommendations();

    return this;
  }

  /**
   * 获取检查结果
   */
  getResult () {
    return {
      modelId: this.modelId,
      modelName: this.model.name,
      compatible: this.compatible,
      errors: this.errors,
      warnings: this.warnings,
      recommendations: this.recommendations,
      deviceInfo: this.deviceInfo.getSummary(),
      modelInfo: {
        size: this.model.size,
        minRam: this.model.minRam,
        recommendedRam: this.model.recommendedRam,
        minVram: this.model.minVram,
        recommendedVram: this.model.recommendedVram,
        cpuCores: this.model.cpuCores,
        recommendedCores: this.model.recommendedCores
      }
    };
  }
}

/**
 * Ollama 拓展资源包管理器
 */
class OllamaExtensionManager {
  constructor (options = {}) {
    this.ollamaPath = options.ollamaPath || 'ollama';
    this.modelsPath = options.modelsPath || join(homedir(), '.ollama', 'models');
    this.deviceInfo = new DeviceInfo();
    this.notifications = [];
  }

  /**
   * 检查 Ollama 是否已安装
   */
  async checkOllamaInstalled () {
    try {
      execSync(`${this.ollamaPath} --version`, { stdio: 'pipe' });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取已安装的模型列表
   */
  async getInstalledModels () {
    try {
      const result = execSync(`${this.ollamaPath} list`, { encoding: 'utf8' });
      const lines = result.split('\n').filter(line => line.trim());
      return lines.map(line => line.trim());
    } catch (error) {
      return [];
    }
  }

  /**
   * 检查模型是否已安装
   */
  async isModelInstalled (modelId) {
    const installedModels = await this.getInstalledModels();
    return installedModels.some(model => model.includes(modelId));
  }

  /**
   * 检查模型兼容性
   */
  async checkCompatibility (modelId) {
    if (!OLLAMA_MODELS[modelId]) {
      throw new Error(`未知模型: ${modelId}`);
    }

    const check = new CompatibilityCheck(modelId, this.deviceInfo);
    await check.checkAll();

    return check.getResult();
  }

  /**
   * 下载模型
   */
  async downloadModel (modelId, onProgress) {
    const compatibility = await this.checkCompatibility(modelId);

    if (!compatibility.compatible) {
      throw new Error(`模型不兼容: ${compatibility.errors.join(', ')}`);
    }

    if (compatibility.warnings.length > 0) {
      this.addNotification({
        type: 'warning',
        title: '兼容性警告',
        message: compatibility.warnings.join('\n'),
        recommendations: compatibility.recommendations
      });
    }

    return new Promise((resolve, reject) => {
      const process = isBrowser ? null : exec(`${this.ollamaPath} pull ${modelId}`);

      if (process) {
        process.stdout.on('data', (data) => {
          if (onProgress) {
            onProgress(data.toString());
          }
        });

        process.stderr.on('data', (data) => {
          if (onProgress) {
            onProgress(data.toString());
          }
        });

        process.on('close', (code) => {
          if (code === 0) {
            resolve({ success: true, modelId });
          } else {
            reject(new Error(`下载失败，退出码: ${code}`));
          }
        });

        process.on('error', (error) => {
          reject(error);
        });
      } else {
        reject(new Error('浏览器环境不支持下载模型'));
      }
    });
  }

  /**
   * 删除模型
   */
  async deleteModel (modelId) {
    try {
      execSync(`${this.ollamaPath} rm ${modelId}`, { stdio: 'pipe' });
      return { success: true, modelId };
    } catch (error) {
      throw new Error(`删除模型失败: ${error.message}`);
    }
  }

  /**
   * 获取所有可用模型
   */
  getAllModels () {
    return Object.entries(OLLAMA_MODELS).map(([id, model]) => ({
      id,
      ...model
    }));
  }

  /**
   * 获取推荐模型
   */
  getRecommendedModels () {
    return this.getAllModels().filter(model => model.recommended);
  }

  /**
   * 添加通知
   */
  addNotification (notification) {
    const id = Date.now();
    this.notifications.push({ id, ...notification, timestamp: new Date() });
    return id;
  }

  /**
   * 获取所有通知
   */
  getNotifications () {
    return this.notifications;
  }

  /**
   * 清除通知
   */
  clearNotifications () {
    this.notifications = [];
  }

  /**
   * 获取设备信息
   */
  async getDeviceInfo () {
    await this.deviceInfo.detectGPU();
    return this.deviceInfo.getSummary();
  }

  /**
   * 生成兼容性报告
   */
  async generateCompatibilityReport (modelId) {
    const compatibility = await this.checkCompatibility(modelId);

    return {
      model: compatibility.modelName,
      compatible: compatibility.compatible,
      errors: compatibility.errors,
      warnings: compatibility.warnings,
      recommendations: compatibility.recommendations,
      device: compatibility.deviceInfo,
      requirements: compatibility.modelInfo
    };
  }

  /**
   * 导出兼容性报告为JSON
   */
  exportCompatibilityReport (modelId, filePath) {
    return this.generateCompatibilityReport(modelId).then(report => {
      writeFileSync(filePath, JSON.stringify(report, null, 2));
      return report;
    });
  }
}

export default OllamaExtensionManager;
export { OLLAMA_MODELS, DeviceInfo, CompatibilityCheck };
