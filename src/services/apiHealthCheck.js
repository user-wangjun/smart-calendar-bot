/**
 * API健康检查服务
 * 检测所有API的连接状态和模型可用性
 */

// import CherryApiClient from '../api/cherryClient.js'; // Cherry API已禁用
import apiKeyManager from '../config/apiKeyManager.js';
import envConfig from '../config/env.js';
import apiValidator from '../utils/apiValidator.js';

class ApiHealthCheck {
  constructor () {
    this.results = [];
    this.testMessage = 'Hello, this is a connection test. Please respond with "OK".';
  }

  /**
   * 检查所有API
   * @returns {Promise<Array>} 检查结果数组
   */
  async checkAllApis () {
    this.results = [];

    // 并行检查所有API
    await Promise.allSettled([
      this.checkOpenRouter(),
      // this.checkCherry(), // Cherry API已禁用
      this.checkZhipu(),
      this.checkOllama(),
      this.checkQiniuAI(),
      this.checkWeather()
    ]);

    return this.results;
  }

  /**
   * 检查OpenRouter API
   */
  async checkOpenRouter () {
    const result = {
      provider: 'openrouter',
      name: 'OpenRouter',
      icon: '🌐',
      status: 'unknown',
      latency: null,
      models: [],
      error: null,
      details: {}
    };

    try {
      const apiKey = apiKeyManager.getOpenRouterApiKey();

      // 验证密钥
      const validation = apiValidator.validateApiKey('openrouter', apiKey);
      if (!validation.valid) {
        result.status = 'invalid_key';
        result.error = validation.errors[0]?.message || 'API密钥无效';
        this.results.push(result);
        return result;
      }

      const startTime = Date.now();

      // 尝试获取模型列表（轻量级请求）
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(10000)
      });

      result.latency = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        result.status = 'online';
        result.models = data.data?.slice(0, 5).map(m => m.id) || [];
        result.details.modelCount = data.data?.length || 0;

        // 测试实际聊天接口
        const chatResult = await this.testOpenRouterChat(apiKey);
        result.details.chatTest = chatResult;
      } else {
        result.status = 'error';
        result.error = `HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (error) {
      result.status = 'offline';
      result.error = error.message;
    }

    this.results.push(result);
    return result;
  }

  /**
   * 测试OpenRouter聊天接口
   */
  async testOpenRouterChat (apiKey) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.href,
          'X-Title': '智能日历助手'
        },
        body: JSON.stringify({
          model: 'arcee-ai/trinity-large-preview:free',
          messages: [{ role: 'user', content: 'Say "OK"' }],
          max_tokens: 5
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          response: data.choices?.[0]?.message?.content || 'OK',
          model: data.model
        };
      } else {
        const error = await response.json();
        return {
          success: false,
          error: error.error?.message || `HTTP ${response.status}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 检查智谱AI API
   */
  async checkZhipu () {
    const result = {
      provider: 'zhipu',
      name: '智谱AI',
      icon: '🧠',
      status: 'unknown',
      latency: null,
      models: [],
      error: null,
      details: {}
    };

    try {
      const apiKey = apiKeyManager.getZhipuApiKey();

      const validation = apiValidator.validateApiKey('zhipu', apiKey);
      if (!validation.valid) {
        result.status = 'invalid_key';
        result.error = validation.errors[0]?.message || 'API密钥无效';
        this.results.push(result);
        return result;
      }

      const startTime = Date.now();

      // 测试聊天接口
      const chatResult = await this.testZhipuChat(apiKey);
      result.latency = Date.now() - startTime;
      result.status = chatResult.success ? 'online' : 'error';
      result.error = chatResult.error;
      result.details = chatResult;
    } catch (error) {
      result.status = 'offline';
      result.error = error.message;
    }

    this.results.push(result);
    return result;
  }

  /**
   * 测试智谱AI聊天接口
   */
  async testZhipuChat (apiKey) {
    try {
      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'glm-4-flash',
          messages: [{ role: 'user', content: 'Say "OK"' }],
          max_tokens: 5
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          response: data.choices?.[0]?.message?.content || 'OK',
          model: data.model
        };
      } else {
        const error = await response.json();
        return {
          success: false,
          error: error.error?.message || `HTTP ${response.status}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 检查Ollama本地服务
   */
  async checkOllama () {
    const result = {
      provider: 'ollama',
      name: 'Ollama Local',
      icon: '🦙',
      status: 'unknown',
      latency: null,
      models: [],
      error: null,
      details: {}
    };

    try {
      const apiUrl = apiKeyManager.getOllamaApiUrl();

      const startTime = Date.now();

      // 检查Ollama服务是否运行
      const response = await fetch(`${apiUrl}/tags`, {
        signal: AbortSignal.timeout(5000)
      });

      result.latency = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        result.status = 'online';
        result.models = data.models?.map(m => m.name) || [];
        result.details.modelCount = data.models?.length || 0;
        result.details.ollamaVersion = data.version;
      } else {
        result.status = 'error';
        result.error = `HTTP ${response.status}`;
      }
    } catch (error) {
      result.status = 'offline';
      result.error = 'Ollama服务未运行或无法连接';
      result.details.suggestion = '请确保Ollama已安装并运行：ollama serve';
    }

    this.results.push(result);
    return result;
  }

  /**
   * 检查七牛云AI
   */
  async checkQiniuAI () {
    const result = {
      provider: 'qiniu',
      name: '七牛云AI',
      icon: '☁️',
      status: 'unknown',
      latency: null,
      models: [],
      error: null,
      details: {}
    };

    try {
      const apiKey = apiKeyManager.getQiniuAIApiKey();

      const validation = apiValidator.validateApiKey('qiniu', apiKey);
      if (!validation.valid) {
        result.status = 'invalid_key';
        result.error = validation.errors[0]?.message || 'API密钥无效';
        this.results.push(result);
        return result;
      }

      const startTime = Date.now();

      // 获取七牛云AI API地址
      const qiniuApiUrl = envConfig.getQiniuAIApiUrl();
      if (!qiniuApiUrl) {
        result.status = 'not_configured';
        result.error = '七牛云AI API地址未配置';
        this.results.push(result);
        return result;
      }

      // 获取模型列表
      const modelsResponse = await fetch(`${qiniuApiUrl}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(10000)
      });

      result.latency = Date.now() - startTime;

      if (modelsResponse.ok) {
        const models = await modelsResponse.json();
        result.status = 'online';
        result.models = models.data?.slice(0, 5).map(m => m.id) || [];
        result.details.modelCount = models.data?.length || 0;

        // 测试聊天接口
        const chatResult = await this.testQiniuChat(apiKey);
        result.details.chatTest = chatResult;
      } else {
        result.status = 'error';
        result.error = `HTTP ${modelsResponse.status}`;
      }
    } catch (error) {
      result.status = 'offline';
      result.error = error.message;
    }

    this.results.push(result);
    return result;
  }

  /**
   * 测试七牛云聊天接口
   */
  async testQiniuChat (apiKey) {
    try {
      const response = await fetch('https://ai.qiniu.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Say "OK"' }],
          max_tokens: 5
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          response: data.choices?.[0]?.message?.content || 'OK',
          model: data.model
        };
      } else {
        const error = await response.json();
        return {
          success: false,
          error: error.error?.message || `HTTP ${response.status}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 检查天气API
   */
  async checkWeather () {
    const result = {
      provider: 'weather',
      name: '心知天气',
      icon: '🌤️',
      status: 'unknown',
      latency: null,
      error: null,
      details: {}
    };

    try {
      const apiKey = envConfig.get('VITE_WEATHER_API_KEY');

      if (!apiKey || apiKey === 'your-weather-api-key') {
        result.status = 'invalid_key';
        result.error = 'API密钥未配置';
        this.results.push(result);
        return result;
      }

      const startTime = Date.now();

      // 测试天气API（获取北京天气）
      const response = await fetch(
        `https://api.seniverse.com/v3/weather/now.json?key=${apiKey}&location=beijing`,
        { signal: AbortSignal.timeout(10000) }
      );

      result.latency = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        result.status = 'online';
        result.details.location = data.results?.[0]?.location?.name;
        result.details.weather = data.results?.[0]?.now?.text;
        result.details.temperature = data.results?.[0]?.now?.temperature;
      } else {
        result.status = 'error';
        result.error = `HTTP ${response.status}`;
      }
    } catch (error) {
      result.status = 'offline';
      result.error = error.message;
    }

    this.results.push(result);
    return result;
  }

  /**
   * 生成健康检查报告
   */
  generateReport () {
    const online = this.results.filter(r => r.status === 'online');
    const offline = this.results.filter(r => r.status === 'offline');
    const errors = this.results.filter(r => r.status === 'error' || r.status === 'invalid_key');

    return {
      summary: {
        total: this.results.length,
        online: online.length,
        offline: offline.length,
        errors: errors.length
      },
      details: this.results,
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * 生成建议
   */
  generateRecommendations () {
    const recommendations = [];

    this.results.forEach(result => {
      if (result.status === 'offline') {
        recommendations.push({
          provider: result.name,
          issue: '服务离线',
          action: result.details.suggestion || '请检查服务是否正常运行'
        });
      } else if (result.status === 'invalid_key') {
        recommendations.push({
          provider: result.name,
          issue: 'API密钥无效',
          action: '请在.env文件或设置中配置有效的API密钥'
        });
      } else if (result.latency > 5000) {
        recommendations.push({
          provider: result.name,
          issue: '响应较慢',
          action: `当前延迟: ${result.latency}ms，建议检查网络连接`
        });
      }
    });

    return recommendations;
  }
}

export default new ApiHealthCheck();
export { ApiHealthCheck };
