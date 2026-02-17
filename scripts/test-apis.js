/**
 * API健康检查脚本
 * 从命令行测试所有API连接
 *
 * 使用方法:
 * node scripts/test-apis.js
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// API配置
const API_CONFIG = {
  openrouter: {
    name: 'OpenRouter',
    icon: '🌐',
    key: process.env.VITE_OPENROUTER_API_KEY || '',
    modelsUrl: 'https://openrouter.ai/api/v1/models',
    chatUrl: 'https://openrouter.ai/api/v1/chat/completions',
    testModel: 'qwen/qwen-2.5-7b-instruct:free'
  },
  cherry: {
    name: 'Cherry Studio',
    icon: '🍒',
    key: process.env.VITE_CHERRY_API_KEY || '',
    chatUrl: 'https://api.cherry.ai/v1/chat/completions',
    testModel: 'deepseek-v3.1'
  },
  ollama: {
    name: 'Ollama Local',
    icon: '🦙',
    url: process.env.VITE_OLLAMA_API_URL || 'http://localhost:11434/api'
  },
  qiniu: {
    name: '七牛云AI',
    icon: '☁️',
    key: process.env.VITE_QINIU_AI_API_KEY || '',
    modelsUrl: 'https://ai.qiniu.com/v1/models',
    chatUrl: 'https://ai.qiniu.com/v1/chat/completions',
    testModel: 'gpt-3.5-turbo'
  },
  weather: {
    name: '心知天气',
    icon: '🌤️',
    key: process.env.VITE_WEATHER_API_KEY || '',
    url: 'https://api.seniverse.com/v3/weather/now.json'
  }
};

// 日志输出
function log (message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader (title) {
  console.log('\n' + '='.repeat(60));
  log(`  ${title}`, 'cyan');
  console.log('='.repeat(60) + '\n');
}

// HTTP请求封装
function makeRequest (url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: options.timeout || 10000
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// 检查OpenRouter
async function checkOpenRouter () {
  const config = API_CONFIG.openrouter;
  const result = { name: config.name, icon: config.icon, status: 'unknown' };

  if (!config.key || config.key === 'your-api-key-here') {
    result.status = 'invalid_key';
    result.error = 'API密钥未配置';
    return result;
  }

  try {
    const startTime = Date.now();

    // 获取模型列表
    const modelsRes = await makeRequest(config.modelsUrl, {
      headers: { Authorization: `Bearer ${config.key}` }
    });

    result.latency = Date.now() - startTime;

    if (modelsRes.status === 200) {
      result.status = 'online';
      result.models = modelsRes.data.data?.slice(0, 5).map(m => m.id) || [];
      result.modelCount = modelsRes.data.data?.length || 0;

      // 测试聊天
      const chatRes = await makeRequest(config.chatUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://localhost',
          'X-Title': 'API Test'
        },
        body: {
          model: config.testModel,
          messages: [{ role: 'user', content: 'Say "OK"' }],
          max_tokens: 5
        },
        timeout: 15000
      });

      result.chatTest = chatRes.status === 200 ? 'passed' : 'failed';
      if (chatRes.status !== 200) {
        result.chatError = chatRes.data.error?.message || `HTTP ${chatRes.status}`;
      }
    } else {
      result.status = 'error';
      result.error = `HTTP ${modelsRes.status}`;
    }
  } catch (error) {
    result.status = 'offline';
    result.error = error.message;
  }

  return result;
}

// 检查Cherry
async function checkCherry () {
  const config = API_CONFIG.cherry;
  const result = { name: config.name, icon: config.icon, status: 'unknown' };

  if (!config.key || config.key === 'your-api-key-here') {
    result.status = 'invalid_key';
    result.error = 'API密钥未配置';
    return result;
  }

  try {
    const startTime = Date.now();

    const chatRes = await makeRequest(config.chatUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.key}`,
        'Content-Type': 'application/json'
      },
      body: {
        model: config.testModel,
        messages: [{ role: 'user', content: 'Say "OK"' }],
        max_tokens: 5
      },
      timeout: 15000
    });

    result.latency = Date.now() - startTime;
    result.status = chatRes.status === 200 ? 'online' : 'error';

    if (chatRes.status !== 200) {
      result.error = chatRes.data.error?.message || `HTTP ${chatRes.status}`;
    } else {
      result.chatTest = 'passed';
    }
  } catch (error) {
    result.status = 'offline';
    result.error = error.message;
  }

  return result;
}

// 检查Ollama
async function checkOllama () {
  const config = API_CONFIG.ollama;
  const result = { name: config.name, icon: config.icon, status: 'unknown' };

  try {
    const startTime = Date.now();

    const res = await makeRequest(`${config.url}/tags`, { timeout: 5000 });

    result.latency = Date.now() - startTime;

    if (res.status === 200) {
      result.status = 'online';
      result.models = res.data.models?.map(m => m.name) || [];
      result.modelCount = res.data.models?.length || 0;
    } else {
      result.status = 'error';
      result.error = `HTTP ${res.status}`;
    }
  } catch (error) {
    result.status = 'offline';
    result.error = 'Ollama服务未运行';
    result.suggestion = '请运行: ollama serve';
  }

  return result;
}

// 检查七牛云AI
async function checkQiniu () {
  const config = API_CONFIG.qiniu;
  const result = { name: config.name, icon: config.icon, status: 'unknown' };

  if (!config.key || config.key === 'your-ai-api-key-here') {
    result.status = 'invalid_key';
    result.error = 'API密钥未配置';
    return result;
  }

  try {
    const startTime = Date.now();

    // 获取模型列表
    const modelsRes = await makeRequest(config.modelsUrl, {
      headers: { Authorization: `Bearer ${config.key}` }
    });

    result.latency = Date.now() - startTime;

    if (modelsRes.status === 200) {
      result.status = 'online';
      result.models = modelsRes.data.data?.slice(0, 5).map(m => m.id) || [];
      result.modelCount = modelsRes.data.data?.length || 0;

      // 测试聊天
      const chatRes = await makeRequest(config.chatUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.key}`,
          'Content-Type': 'application/json'
        },
        body: {
          model: config.testModel,
          messages: [{ role: 'user', content: 'Say "OK"' }],
          max_tokens: 5
        },
        timeout: 15000
      });

      result.chatTest = chatRes.status === 200 ? 'passed' : 'failed';
      if (chatRes.status !== 200) {
        result.chatError = chatRes.data.error?.message || `HTTP ${chatRes.status}`;
      }
    } else {
      result.status = 'error';
      result.error = `HTTP ${modelsRes.status}`;
    }
  } catch (error) {
    result.status = 'offline';
    result.error = error.message;
  }

  return result;
}

// 检查天气API
async function checkWeather () {
  const config = API_CONFIG.weather;
  const result = { name: config.name, icon: config.icon, status: 'unknown' };

  if (!config.key || config.key === 'your-weather-api-key') {
    result.status = 'invalid_key';
    result.error = 'API密钥未配置';
    return result;
  }

  try {
    const startTime = Date.now();

    const url = `${config.url}?key=${config.key}&location=beijing`;
    const res = await makeRequest(url, { timeout: 10000 });

    result.latency = Date.now() - startTime;

    if (res.status === 200) {
      result.status = 'online';
      result.location = res.data.results?.[0]?.location?.name;
      result.weather = res.data.results?.[0]?.now?.text;
      result.temperature = res.data.results?.[0]?.now?.temperature;
    } else {
      result.status = 'error';
      result.error = `HTTP ${res.status}`;
    }
  } catch (error) {
    result.status = 'offline';
    result.error = error.message;
  }

  return result;
}

// 打印结果
function printResult (result) {
  const statusColors = {
    online: 'green',
    offline: 'red',
    error: 'yellow',
    invalid_key: 'yellow'
  };

  const statusIcons = {
    online: '✅',
    offline: '❌',
    error: '⚠️',
    invalid_key: '🔑'
  };

  const color = statusColors[result.status] || 'gray';
  const icon = statusIcons[result.status] || '❓';

  log(`\n${result.icon} ${result.name}`, 'cyan');
  log(`   状态: ${icon} ${result.status.toUpperCase()}`, color);

  if (result.latency) {
    const latencyColor = result.latency < 1000
      ? 'green'
      : result.latency < 3000 ? 'yellow' : 'red';
    log(`   延迟: ${result.latency}ms`, latencyColor);
  }

  if (result.models && result.models.length > 0) {
    log(`   可用模型: ${result.models.join(', ')}`, 'gray');
  }

  if (result.chatTest) {
    const chatColor = result.chatTest === 'passed' ? 'green' : 'red';
    log(`   聊天测试: ${result.chatTest === 'passed' ? '✅ 通过' : '❌ 失败'}`, chatColor);
    if (result.chatError) {
      log(`   错误: ${result.chatError}`, 'red');
    }
  }

  if (result.weather) {
    log(`   天气: ${result.location} ${result.weather} ${result.temperature}°C`, 'blue');
  }

  if (result.error) {
    log(`   错误: ${result.error}`, 'red');
  }

  if (result.suggestion) {
    log(`   建议: ${result.suggestion}`, 'yellow');
  }
}

// 主函数
async function main () {
  logHeader('🔍 API 健康检查');

  log('正在检查所有API连接...\n', 'blue');

  const results = [];

  // 顺序检查所有API
  results.push(await checkOpenRouter());
  results.push(await checkCherry());
  results.push(await checkOllama());
  results.push(await checkQiniu());
  results.push(await checkWeather());

  // 打印结果
  results.forEach(printResult);

  // 统计
  const online = results.filter(r => r.status === 'online').length;
  const offline = results.filter(r => r.status === 'offline').length;
  const errors = results.filter(r => r.status === 'error' || r.status === 'invalid_key').length;

  logHeader('📊 检查结果汇总');
  log(`✅ 在线: ${online}`, 'green');
  log(`❌ 离线: ${offline}`, 'red');
  log(`⚠️  错误: ${errors}`, 'yellow');
  log(`📈 总计: ${results.length}`, 'cyan');

  // 建议
  const issues = results.filter(r => r.status !== 'online');
  if (issues.length > 0) {
    logHeader('💡 改进建议');
    issues.forEach(issue => {
      log(`${issue.name}:`, 'yellow');
      if (issue.status === 'invalid_key') {
        log(`  → 配置API密钥: export VITE_${issue.name.toUpperCase().replace(/\s/g, '_')}_API_KEY=your-key`, 'gray');
      } else if (issue.status === 'offline' && issue.name === 'Ollama Local') {
        log('  → 启动Ollama: ollama serve', 'gray');
      } else {
        log('  → 检查网络连接和API配置', 'gray');
      }
    });
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

// 运行
main().catch(error => {
  console.error('检查失败:', error);
  process.exit(1);
});
