# 智能日历助手

## 📋 项目简介

智能日历助手是一个功能完善、用户体验优秀的智能日历应用，支持日历视图、事件管理、AI 智能对话、天气集成等功能。

### 🎯 重要说明

**本项目为纯前端 SPA 应用，不需要购买服务器！**

- ✅ 所有 API 调用都是第三方服务（OpenRouter、智谱 AI、高德地图等）
- ✅ 数据存储在浏览器本地（IndexedDB / LocalStorage）
- ✅ 可直接部署到 GitHub Pages、Vercel、Netlify 等平台
- ✅ 国内访问推荐使用 GitHub Pages（无需备案，速度尚可）

### 核心特性

- 📅 **日历管理** - 月/周/日视图，事件创建、编辑、删除
- 🤖 **AI 助手** - 智能日程管家，支持自然语言创建日程
- 💬 **AI 对话** - 集成 OpenRouter、智谱 AI、七牛云 AI 等多个 AI 模型
- 🎨 **AI 图像生成** - 基于文本生成个性化内容
- 🗺 **地图定位** - 集成高德地图/腾讯地图，支持定位和天气
- ☁ **天气集成** - 实时天气、未来预报、生活指数
- 🔐 **密钥管理** - AES-256 加密存储，自动隐藏敏感信息
- 📱 **响应式设计** - 支持 PC 端和移动端
- 💰 **零成本运行** - 可完全使用免费服务

---

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-username/smart-calendar-assistant.git
cd smart-calendar-assistant
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置 API 密钥（可选）

编辑 `.env` 文件，填入您的 API 密钥：

```bash
# OpenRouter API 密钥
VITE_OPENROUTER_API_KEY=your-openrouter-api-key

# 智谱 AI API 密钥
VITE_ZHIPU_API_KEY=your-zhipu-api-key

# 七牛云 AI API 密钥
VITE_QINIU_AI_API_KEY=your-qiniu-ai-api-key

# 高德地图 API 密钥
VITE_AMAP_API_KEY=your-amap-api-key
VITE_AMAP_SECRET_KEY=your-amap-secret-key

# 腾讯地图 API 密钥
VITE_TENCENT_MAP_KEY=your-tencent-map-key
```

**说明**：
- 不配置 API 密钥时，用户可在设置页面自行配置
- API 密钥存储在浏览器本地，不会上传

### 4. 启动开发服务器

```bash
npm run dev
```

访问 `http://127.0.0.1:5173`

### 5. 构建生产版本

```bash
npm run build
```

---

## 📦 部署方案

### 方案 1: GitHub Pages ⭐ 强烈推荐

**特点**：
- ✅ 完全免费
- ✅ 无需 ICP 备案
- ✅ 国内大部分地区可访问
- ✅ 自动 CI/CD

**一键部署**：

```powershell
# Windows PowerShell
.\deploy-to-github.ps1
```

**手动部署**：

```bash
# 1. 创建 GitHub 仓库
# 2. 推送代码
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/用户名/仓库名.git
git push -u origin main

# 3. 配置 GitHub Pages
# Settings → Pages → Source: GitHub Actions

# 4. 访问
# https://用户名.github.io/仓库名/
```

**详细文档**：[docs/guides/GitHub Pages 部署指南.md](./docs/guides/GitHub%20Pages%20部署指南.md)

---

### 方案 2: Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel
```

**注意**：Vercel 默认域名在国内可能需要挂梯子访问，可绑定自定义域名改善。

---

### 方案 3: Netlify

```bash
# 安装 Netlify CLI
npm i -g netlify-cli

# 部署
netlify deploy --prod
```

---

### 方案 4: 国内对象存储（需 ICP 备案）

**平台**：
- 腾讯云 COS
- 阿里云 OSS
- 七牛云存储

**特点**：
- ✅ 访问速度最快
- ✅ 稳定性高
- ❌ 需要 ICP 备案
- 💰 按量付费（有免费额度）

---

## 🛠️ 技术栈

### 前端
- **Vue.js 3.5.27** - 渐进式 JavaScript 框架
- **Vite 7.3.1** - 快速前端构建工具
- **Tailwind CSS 4.1.18** - 实用优先的 CSS 框架
- **Pinia 3.0.4** - Vue 状态管理
- **Vue Router 4.6.4** - 官方路由
- **Element Plus** - UI 组件库

### 第三方服务
- **OpenRouter** - 多模型 AI 服务
- **智谱 AI** - GLM 系列模型
- **七牛云 AI** - AI 图像生成
- **高德地图** - 地图和天气 API
- **腾讯地图** - 定位服务

---

## 📝 可用脚本

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 构建 GitHub Pages 版本
npm run build:github

# 预览生产构建
npm run preview

# 运行测试
npm run test

# ESLint 检查
npm run lint
npm run lint:fix
```

---

## 📚 文档

- [GitHub Pages 部署指南](./docs/guides/GitHub%20Pages%20部署指南.md)
- [部署方案总结](./docs/guides/部署方案总结.md)
- [API 文档](./docs/API_DOCUMENTATION.md)
- [设计系统](./docs/DESIGN_SYSTEM.md)

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License

---

## 🙏 致谢

感谢以下开源项目和服务：
- Vue.js 团队
- Vite 团队
- Element Plus 团队
- 所有 API 服务提供商

---

**祝你使用愉快！** 🎉
