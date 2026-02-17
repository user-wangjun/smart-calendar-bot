# Ollama API 集成指南

## 📋 概述

Ollama 是一个本地运行大语言模型的工具，可以在本地运行各种开源模型，无需API密钥，完全免费且保护隐私。

## 🚀 快速开始

### 1. 安装 Ollama

#### Windows
```bash
# 使用 PowerShell
iwr -useb get-ollama.com | iex

# 或使用 Chocolatey
choco install ollama

# 或使用 Scoop
scoop install ollama
```

#### macOS
```bash
# 使用 Homebrew
brew install ollama

# 或使用 curl
curl -fsSL https://ollama.com/install.sh | sh
```

#### Linux
```bash
# 使用 curl
curl -fsSL https://ollama.com/install.sh | sh

# 或使用 apt
sudo apt update && sudo apt install ollama
```

### 2. 下载模型

```bash
# 下载 Llama 3.1 8B（推荐）
ollama pull llama3.1

# 下载 Qwen 2.5 7B（中文推荐）
ollama pull qwen2.5:7b

# 下载 Mistral 7B
ollama pull mistral:7b

# 下载 Phi-3 Mini（轻量级）
ollama pull phi3:mini

# 查看所有可用模型
ollama list
```

### 3. 启动 Ollama 服务

```bash
# 启动 Ollama API 服务（默认端口 11434）
ollama serve

# 自定义端口
OLLAMA_HOST=0.0.0.0 OLLAMA_PORT=11435 ollama serve

# 后台运行（Linux/macOS）
nohup ollama serve > ollama.log 2>&1 &

# Windows 后台运行
Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
```

### 4. 验证安装

```bash
# 检查 Ollama 是否运行
curl http://localhost:11434/api/tags

# 测试聊天接口
curl http://localhost:11434/api/chat -X POST -H "Content-Type: application/json" -d '{
  "model": "llama3.1",
  "messages": [{"role": "user", "content": "Hello!"}],
  "stream": false
}'
```

## 📦 可用模型

### 推荐模型

| 模型名称 | 描述 | 大小 | 上下文长度 | 推荐场景 |
|---------|------|------|-----------|----------|
| **llama3.1** | Meta Llama 3.1 8B | 4.7GB | 128K | 通用对话、复杂任务 |
| **qwen2.5:7b** | 通义千问 2.5 7B | 4.5GB | 32K | 中文对话、文本生成 |
| **mistral:7b** | Mistral 7B | 4.1GB | 32K | 快速推理、通用对话 |
| **phi3:mini** | Phi-3 Mini 3.8B | 2.3GB | 128K | 快速推理、边缘设备 |
| **gemma2:9b** | Google Gemma 2 9B | 5.5GB | 8K | 通用对话、推理 |

### 专业模型

| 模型名称 | 描述 | 大小 | 上下文长度 | 推荐场景 |
|---------|------|------|-----------|----------|
| **llama3.1:70b** | Meta Llama 3.1 70B | 40GB | 128K | 复杂推理、高质量对话 |
| **qwen2.5:14b** | 通义千问 2.5 14B | 9GB | 32K | 复杂任务、多轮对话 |
| **mixtral:8x7b** | Mistral Mixtral 8x7B | 26GB | 32K | 复杂推理、高质量输出 |
| **deepseek-coder-v2** | DeepSeek Coder V2 16B | 9GB | 16K | 代码生成、编程辅助 |
| **codellama:13b** | CodeLlama 13B | 7.4GB | 16K | 代码生成、编程辅助 |

## 🔧 配置说明

### 环境变量配置

在 `.env` 文件中配置：

```env
# Ollama API配置（本地）
# Ollama是本地运行大语言模型的工具
# 默认地址：http://localhost:11434/api
# 如果Ollama运行在其他端口或服务器，请修改下面的URL
OLLAMA_API_URL=http://localhost:11434/api
```

### 自定义端口

```bash
# 修改 Ollama 服务端口
export OLLAMA_PORT=11435
ollama serve

# 或在启动时指定
OLLAMA_HOST=0.0.0.0 OLLAMA_PORT=11435 ollama serve
```

### 远程访问

```bash
# 允许远程访问（谨慎使用）
OLLAMA_HOST=0.0.0.0 ollama serve

# 使用 Nginx 反向代理
# /etc/nginx/sites-available/ollama
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:11434;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 💻 使用示例

### JavaScript/Node.js

```javascript
import { createCalendarChatService } from './src/services/chatService.js';

const chatService = createCalendarChatService();
await chatService.init();

// 使用 Ollama 模型
const result = await chatService.sendMessage('你好，请介绍一下你自己', {
  model: 'llama3.1'
});

console.log(result.content);
```

### cURL

```bash
# 基本聊天请求
curl http://localhost:11434/api/chat -X POST -H "Content-Type: application/json" -d '{
  "model": "llama3.1",
  "messages": [
    {"role": "system", "content": "你是一个智能日历助手"},
    {"role": "user", "content": "今天天气怎么样？"}
  ],
  "stream": false
}'

# 流式聊天请求
curl http://localhost:11434/api/chat -X POST -H "Content-Type: application/json" -d '{
  "model": "llama3.1",
  "messages": [{"role": "user", "content": "讲个笑话"}],
  "stream": true
}'
```

### Python

```python
import requests

url = "http://localhost:11434/api/chat"
headers = {"Content-Type": "application/json"}
data = {
    "model": "llama3.1",
    "messages": [
        {"role": "system", "content": "你是一个智能日历助手"},
        {"role": "user", "content": "今天天气怎么样？"}
    ],
    "stream": False
}

response = requests.post(url, json=data, headers=headers)
print(response.json())
```

## 🎯 参数说明

### 模型参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|---------|------|
| `model` | string | `llama3.1` | 模型名称 |
| `temperature` | number | `0.7` | 控制随机性（0.0-2.0） |
| `max_tokens` | number | `1000` | 最大生成tokens数 |
| `top_p` | number | `0.9` | 核采样参数（0.0-1.0） |
| `frequency_penalty` | number | `0.5` | 频率惩罚（-2.0-2.0） |
| `presence_penalty` | number | `0.5` | 存在惩罚（-2.0-2.0） |
| `stream` | boolean | `false` | 是否流式输出 |

### 参数调优建议

```javascript
// 创造性写作
{
  temperature: 1.0,
  top_p: 0.95,
  frequency_penalty: 0.7,
  presence_penalty: 0.7
}

// 事实性回答
{
  temperature: 0.3,
  top_p: 0.8,
  frequency_penalty: 0.3,
  presence_penalty: 0.3
}

// 代码生成
{
  temperature: 0.2,
  top_p: 0.9,
  frequency_penalty: 0.1,
  presence_penalty: 0.1
}

// 中文对话
{
  temperature: 0.7,
  top_p: 0.9,
  frequency_penalty: 0.5,
  presence_penalty: 0.5
}
```

## 📊 性能优化

### 模型选择

```bash
# 轻量级模型（快速响应）
ollama pull phi3:mini
# 适合：快速对话、边缘设备

# 中等模型（平衡性能）
ollama pull llama3.1
# 适合：通用场景、日常使用

# 大型模型（高质量输出）
ollama pull llama3.1:70b
# 适合：复杂任务、高质量要求
```

### GPU 加速

```bash
# 检查 GPU 支持
ollama --version

# 使用 GPU 运行（需要 CUDA）
CUDA_VISIBLE_DEVICES=0 ollama serve

# 多 GPU 配置
CUDA_VISIBLE_DEVICES=0,1 ollama serve
```

### 内存优化

```bash
# 设置最大上下文长度
OLLAMA_NUM_CTX=8192 ollama serve

# 限制并发请求数
OLLAMA_NUM_PARALLEL=2 ollama serve

# 使用量化模型（更小内存）
ollama pull llama3.1:8b-q4_K_M
```

## 🔒 安全建议

### 本地访问

```bash
# 仅监听本地
OLLAMA_HOST=127.0.0.1 ollama serve

# 使用防火墙限制访问
# Linux
sudo ufw allow from 192.168.1.0/24 to any port 11434

# Windows
New-NetFirewallRule -DisplayName "Ollama" -Direction Inbound -LocalPort 11434 -Protocol TCP -Action Allow
```

### 身份验证

```bash
# 使用 Nginx 基本认证
# /etc/nginx/sites-available/ollama
server {
    listen 80;
    server_name your-domain.com;

    auth_basic "Restricted";
    auth_basic_user_file /etc/nginx/.htpasswd;

    location / {
        proxy_pass http://localhost:11434;
    }
}

# 创建密码文件
sudo htpasswd -c /etc/nginx/.htpasswd user
```

## 🐛 故障排除

### 常见问题

**1. 连接被拒绝**
```bash
# 检查 Ollama 是否运行
curl http://localhost:11434/api/tags

# 检查端口是否被占用
netstat -tuln | grep 11434  # Linux/macOS
netstat -an | findstr 11434  # Windows
```

**2. 模型未找到**
```bash
# 列出已下载的模型
ollama list

# 下载缺失的模型
ollama pull llama3.1
```

**3. 内存不足**
```bash
# 使用量化模型
ollama pull llama3.1:8b-q4_K_M

# 减少上下文长度
OLLAMA_NUM_CTX=4096 ollama serve

# 关闭其他应用释放内存
```

**4. 响应缓慢**
```bash
# 检查 GPU 使用
nvidia-smi  # NVIDIA
rocm-smi  # AMD

# 使用更小的模型
ollama pull phi3:mini
```

### 日志调试

```bash
# 启用详细日志
OLLAMA_DEBUG=1 ollama serve

# 查看日志文件
tail -f ollama.log

# Windows 事件查看器
eventvwr.msc
```

## 📚 参考资料

### 官方文档
- [Ollama 官网](https://ollama.com)
- [Ollama GitHub](https://github.com/ollama/ollama)
- [Ollama API 文档](https://github.com/ollama/ollama/blob/main/docs/api.md)

### 模型资源
- [Hugging Face](https://huggingface.co/models)
- [Ollama 模型库](https://ollama.com/library)

### 社区支持
- [Ollama Discord](https://discord.gg/ollama)
- [Ollama Reddit](https://reddit.com/r/ollama)

## 💡 最佳实践

1. **模型选择**
   - 日常使用：`llama3.1` 或 `qwen2.5:7b`
   - 快速响应：`phi3:mini`
   - 高质量：`llama3.1:70b`
   - 代码生成：`deepseek-coder-v2`

2. **参数调优**
   - 创造性任务：提高 temperature（0.8-1.2）
   - 事实性任务：降低 temperature（0.2-0.5）
   - 代码生成：使用低 temperature（0.1-0.3）

3. **资源管理**
   - 定期清理未使用的模型
   - 监控内存和 GPU 使用
   - 使用量化模型节省内存

4. **安全考虑**
   - 仅在受信任的网络中暴露 API
   - 使用身份验证保护远程访问
   - 定期更新 Ollama 版本

---

**文档版本**：v1.0  
**最后更新**：2026年1月14日  
**维护人**：开发团队

**🎉 重要提示**：Ollama 完全免费且本地运行，无需 API 密钥，保护隐私！
