# Vercel 部署诊断报告

**生成时间**: 2026-03-01
**项目**: 智能日历助手
**诊断结果**: 配置缺失导致的前端路由异常与环境变量未配置

---

## 1. 根本原因分析

经过对项目结构、配置文件及构建日志的详细排查，发现导致项目在 Vercel 部署后无法正常运行的主要原因如下：

1.  **SPA 路由重写缺失 (Critical)**:
    -   **现象**: 访问非根路径（如 `/calendar`）刷新页面会报 404 错误。
    -   **原因**: 项目根目录缺少 `vercel.json` 配置文件，Vercel 无法正确处理 Vue Router 的单页应用（SPA）路由请求，导致直接查找对应文件而非重定向到 `index.html`。
    -   **影响**: 用户无法直接访问深层链接，刷新页面即崩溃。

2.  **环境变量未配置 (High)**:
    -   **现象**: AI 对话、地图定位、天气查询等功能失效，控制台可能报错 `401 Unauthorized` 或 `API Key missing`。
    -   **原因**: 本地 `.env` 文件不会上传到 Vercel，且 Vercel 项目设置中未添加必要的环境变量（如 `VITE_OPENROUTER_API_KEY`, `VITE_AMAP_API_KEY` 等）。
    -   **影响**: 核心业务功能完全不可用。

3.  **后端服务未部署 (Medium)**:
    -   **现象**: 若项目依赖 `mcp-services` 目录下的后端服务，则相关功能（如用户登录、数据持久化到 MongoDB）将无法使用。
    -   **原因**: `mcp-services` 目录被 `.vercelignore` 忽略，且该目录为 Express 应用，未适配 Vercel Serverless Functions 架构。
    -   **现状**: 前端目前主要依赖第三方 API（OpenRouter, 高德地图等），未直接调用自建后端（代码中无对 `3001` 端口的直接调用）。若仅需前端功能，此项可忽略；若需完整功能，需单独部署后端。

---

## 2. 修复措施

### 2.1 添加 `vercel.json` (已执行)
已在项目根目录创建 `vercel.json` 文件，配置了 SPA 路由重写规则：
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 2.2 配置 Vercel 环境变量 (需手动执行)
请登录 [Vercel 控制台](https://vercel.com/dashboard)，进入项目 **Settings -> Environment Variables**，添加以下变量（根据实际使用的服务选择）：

| 变量名 | 描述 | 示例值 |
| :--- | :--- | :--- |
| `VITE_OPENROUTER_API_KEY` | OpenRouter API 密钥 | `sk-or-v1-...` |
| `VITE_ZHIPU_API_KEY` | 智谱 AI API 密钥 | `...` |
| `VITE_AMAP_API_KEY` | 高德地图 Key | `...` |
| `VITE_AMAP_SECRET_KEY` | 高德地图安全密钥 | `...` |
| `VITE_TENCENT_MAP_KEY` | 腾讯地图 Key | `...` |
| `VITE_OLLAMA_API_URL` | Ollama 地址 (需公网可访问) | `https://your-ollama.com` |

*注意：本地开发用的 `http://localhost:11434` 在 Vercel 云端无法访问，需提供公网地址或使用云端 AI 服务。*

### 2.3 验证 Node.js 版本 (已核对)
`package.json` 指定 `"engines": { "node": "20.x" }`，Vercel 默认支持 Node.js 20，配置正确。

---

## 3. 后续监控指标

部署修复并成功上线后，建议关注以下指标：

1.  **Web Vitals**:
    -   **FCP (First Contentful Paint)**: 应 < 1.8s。
    -   **LCP (Largest Contentful Paint)**: 应 < 2.5s。
    -   **CLS (Cumulative Layout Shift)**: 应 < 0.1。
    -   *可在 Vercel Analytics 选项卡中查看。*

2.  **API 错误率**:
    -   监控 `/api/*` 或第三方 API 调用的失败率（4xx/5xx）。
    -   重点关注 AI 服务和地图服务的配额限制和超时情况。

---

## 4. 防止回归的自动化测试

建议在 CI/CD 流程（如 GitHub Actions 或 Vercel Checks）中集成以下测试：

1.  **构建检查**: 确保 `npm run build` 在 Node 20 环境下成功。
2.  **Lint 检查**: 运行 `npm run lint` 确保代码规范。
3.  **单元测试**: 运行 `npm run test` (Jest) 验证核心逻辑。
    -   特别关注 `tests/integration/naturalLanguageFlow.test.js` 确保自然语言处理功能正常。

---

## 5. 关于后端 (mcp-services) 的特别说明

目前 `mcp-services` 包含一个完整的 Express + MongoDB 后端应用。**Vercel 不适合直接部署此类长运行应用**。

若未来需要启用此后端：
1.  **方案 A (推荐)**: 将 `mcp-services` 部署到 **Railway**, **Render** 或 **云服务器 (ECS/CVM)**，并在 Vercel 环境变量中配置 `VITE_API_BASE_URL` 指向该后端地址。
2.  **方案 B (改造)**: 将 Express 应用重构为 Vercel Serverless Functions (放入 `api/` 目录)，但需解决 MongoDB 连接复用和 Cron 任务无法运行的问题。
