# Vercel 环境变量配置指南

本文档指导如何在 Vercel 平台正确配置环境变量，确保智能日历助手的核心功能（AI、地图、天气）正常运行。

## 1. 哪些密钥需要填写？

根据密钥的用途，我们将密钥分为**必须配置**和**按需配置**两类。

### 1.1 🔴 必须配置 (基础功能)
这些密钥影响应用的**定位**和**天气**功能。如果缺失，用户打开应用时会看到报错，且普通用户通常无法自行获取这些密钥。**建议开发者提供。**

| 变量名 | 描述 | 获取方式 |
| :--- | :--- | :--- |
| `VITE_AMAP_API_KEY` | **高德地图 Key** (Web端) | [高德开放平台](https://console.amap.com/) 申请 "Web服务" Key |
| `VITE_AMAP_SECRET_KEY` | **高德地图安全密钥** | 同上，配套的安全密钥 |
| `VITE_TENCENT_MAP_KEY` | **腾讯地图 Key** (备用) | [腾讯位置服务](https://lbs.qq.com/) |

### 1.2 🟡 按需配置 (AI 功能)
这些密钥用于驱动 AI 助手。

*   **策略 A：开箱即用 (推荐)**
    *   **填**: 在 Vercel 中配置你的 Key。
    *   **效果**: 用户打开应用就能直接对话，消耗你的额度。
*   **策略 B：用户自带 Key (BYOK)**
    *   **不填**: Vercel 中留空。
    *   **效果**: AI 功能默认不可用，用户需要在“设置 -> API 管理”中填入自己的 Key 才能使用。

| 变量名 | 描述 | 示例值 |
| :--- | :--- | :--- |
| `VITE_OPENROUTER_API_KEY` | OpenRouter (聚合模型) | `sk-or-v1-...` |
| `VITE_ZHIPU_API_KEY` | 智谱 AI (国产模型) | `...` |
| `VITE_OLLAMA_API_URL` | Ollama 服务地址 | 需填公网地址 (https://...), **不能填 localhost** |

---

## 2. 如何在 Vercel 中填写？

### 步骤 1: 准备密钥
确保你已经拥有上述服务的 API Key。如果没有，请先去对应平台申请。

### 步骤 2: 进入设置页面
1.  登录 [Vercel 控制台](https://vercel.com/dashboard)。
2.  点击你的项目 (**Smart Calendar Assistant**)。
3.  点击顶部导航栏的 **Settings** (设置)。
4.  在左侧菜单点击 **Environment Variables** (环境变量)。

### 步骤 3: 添加变量
你可以逐个添加，也可以批量添加。

#### 方式 A: 逐个添加 (推荐新手)
1.  **Key**: 输入变量名 (例如 `VITE_AMAP_API_KEY`)。
2.  **Value**: 输入你的密钥值 (例如 `a1b2c3d4...`)。
3.  **Environments**: 默认全选 (Production, Preview, Development)。
4.  点击 **Save**。

#### 方式 B: 批量添加 (复制粘贴)
1.  点击 "Copy .env" 或直接在输入框切换到文本模式。
2.  将以下内容复制并在记事本中填好值，然后粘贴进去：

```bash
VITE_AMAP_API_KEY=你的高德Key
VITE_AMAP_SECRET_KEY=你的高德安全密钥
VITE_OPENROUTER_API_KEY=你的OpenRouterKey
VITE_OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
VITE_ZHIPU_API_URL=https://open.bigmodel.cn/api/paas/v4/chat/completions
```

### 步骤 4: 重新部署 (重要！)
**配置环境变量后，必须重新部署才能生效。**

1.  点击顶部导航栏的 **Deployments**。
2.  找到最近一次部署，点击右侧的 **三个点 (...)**。
3.  选择 **Redeploy**。
4.  等待部署完成，访问页面验证功能。

---

## 3. 常见问题

**Q: 我填了 Key 为什么还是报错 401/403？**
*   **检查 1**: 是否重新部署了？(Redeploy)
*   **检查 2**: 变量名是否完全一致？(注意 `VITE_` 前缀)
*   **检查 3**: 高德地图 Key 是否绑定了正确的域名？(在开发阶段可能需要允许 `localhost`，上线后需要添加 Vercel 分配的域名)。

**Q: `VITE_OLLAMA_API_URL` 填什么？**
*   Vercel 是云端环境，无法访问你电脑上的 `localhost:11434`。
*   如果你没有公网可访问的 Ollama 服务，**请不要在 Vercel 中配置此项**，或者留空。
*   建议引导用户在本地运行 Ollama，并在前端“设置”中填入 `http://localhost:11434` (前端浏览器可以直接访问本地)。
