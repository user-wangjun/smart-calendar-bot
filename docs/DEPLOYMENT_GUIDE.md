# 部署配置指南

## 1. 环境要求
- **Node.js**: v16.0.0 或更高版本
- **包管理器**: npm 或 yarn
- **操作系统**: Windows, macOS, 或 Linux

## 2. 环境变量配置
本项目依赖环境变量来管理系统级 API 密钥。

1. 在项目根目录创建 `.env` 文件（如果不存在）。
2. 添加以下配置：

```env
# 智谱 AI API 密钥 (系统模式必需)
ZHIPU_API_KEY=your_zhipu_api_key_here

# 可选：其他服务配置
# QINIU_ACCESS_KEY=...
# QINIU_SECRET_KEY=...
```

**注意**: `ZHIPU_API_KEY` 是系统模式 (`System Mode`) 正常工作的关键。如果没有配置该变量，系统模式将不可用，用户只能使用自定义模式。

## 3. 安装依赖
```bash
npm install
```

## 4. 开发环境运行
```bash
npm run dev
```
访问 `http://localhost:5173` (或终端显示的端口)。

## 5. 生产环境构建与部署

### 5.1 构建
```bash
npm run build
```
构建产物将输出到 `dist/` 目录。

### 5.2 部署
将 `dist/` 目录下的所有文件部署到任意静态 Web 服务器（如 Nginx, Apache, Vercel, Netlify）。

**Nginx 配置示例**:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 6. 模型模块验证
部署完成后，请按以下步骤验证模型模块：
1. **系统模式验证**:
   - 进入"AI 助手"页面。
   - 确认左侧面板显示"系统模型"。
   - 如果 `ZHIPU_API_KEY` 配置正确，应显示"API Key: 已配置"。
   - 发送一条测试消息，确认能收到回复。

2. **自定义模式验证**:
   - 切换到右侧"自选模型"。
   - 选择一个平台（如 OpenAI）。
   - 输入有效的 API Key 和 Model ID。
   - 发送测试消息，确认能收到回复。
