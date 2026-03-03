# 密钥管理方案 (Key Management Scheme)

**版本**: 1.0  
**生效日期**: 2026-03-01  
**适用范围**: 智能日历助手 (Frontend & Backend)

---

## 1. 概述

本方案旨在解决项目中 API 密钥管理分散、硬编码风险高、缺乏分层控制等问题。通过区分"用户填写"与"代码内置"两类密钥，并引入统一的 `KeyManager` 服务，实现安全、可维护的密钥生命周期管理。

### 核心原则
1.  **零信任**: 假定所有前端代码都可能被反编译，严禁在源码中硬编码敏感密钥。
2.  **分层管理**: 开发环境与生产环境隔离，用户自定义密钥与系统内置密钥隔离。
3.  **最小权限**: 仅在需要时获取密钥，且优先使用受控的系统密钥。

---

## 2. 密钥分类

| 分类 | 定义 | 存储方式 (Dev) | 存储方式 (Prod) | 典型用途 |
| :--- | :--- | :--- | :--- | :--- |
| **用户填写 (User-filled)** | 用户在设置界面手动输入的个人密钥 | LocalStorage (AES加密) | LocalStorage (AES加密) | BYOK (Bring Your Own Key) 模式，如个人 OpenRouter Key |
| **代码内置 (Code-built-in)** | 项目级共享密钥，由运维/CI注入 | `.env` 文件 | Vercel Environment Variables | 地图 SDK Key、公共服务 Token、后端 API 地址 |

---

## 3. 架构设计

### 3.1 统一密钥管理服务 (`KeyManager`)

所有业务代码**禁止**直接访问 `localStorage` 或 `import.meta.env` 获取密钥，必须通过 `KeyManager` 单例访问。

```javascript
import KeyManager from '@/services/security/KeyManager';

// 获取密钥 (自动处理环境优先级)
const apiKey = KeyManager.getKey('OPENROUTER_API_KEY');

// 严格校验 (默认开启)
if (!apiKey) {
  showError('密钥无效或未配置');
}
```

### 3.2 环境优先级策略

*   **生产环境 (Production)**:
    1.  **Vercel Env Vars** (最高优先级): 运维配置的系统级密钥。
    2.  **User Storage**: 用户填写的个人密钥 (作为补充/覆盖)。
    
*   **开发环境 (Development)**:
    1.  **User Storage** (最高优先级): 方便开发者本地调试，不污染 `.env`。
    2.  **`.env` File**: 团队共享的测试密钥。

### 3.3 校验机制 (`KeyValidators`)

在密钥设置和获取时，执行严格的正则校验：

*   **OpenRouter**: `sk-or-v1-` 开头，长度 > 30。
*   **智谱 AI**: `id.secret` 格式。
*   **地图 SDK**: 固定长度字母数字。

---

## 4. 配置指南

### 4.1 用户填写类 (User-filled)

1.  进入应用 **系统设置** -> **API 管理**。
2.  选择对应的服务商 (如 OpenRouter)。
3.  输入 API Key。
4.  系统自动校验格式，通过后加密存储于本地。

### 4.2 代码内置类 (Code-built-in)

#### 本地开发
在项目根目录创建或编辑 `.env`:
```ini
VITE_OPENROUTER_API_KEY=sk-or-v1-test-key...
VITE_AMAP_API_KEY=your_amap_key
```

#### 生产部署 (Vercel)
1.  登录 Vercel Dashboard。
2.  进入 **Settings** -> **Environment Variables**。
3.  添加变量 (如 `VITE_OPENROUTER_API_KEY`)。
4.  重新部署生效。

---

## 5. 安全流程

### 5.1 密钥轮换 (Rotation)
*   **用户密钥**: 用户自行在设置界面更新即可，即时生效。
*   **系统密钥**: 
    1.  运维在 Vercel 后台更新环境变量。
    2.  触发 Redeploy (重新构建)。
    3.  旧版本缓存过期后，新密钥生效。

### 5.2 应急吊销 (Revocation)
若发生密钥泄露：
1.  **立即在服务商后台 (如 OpenAI/OpenRouter) 删除该 Key**。
2.  若为系统密钥，更新 Vercel 环境变量并重新部署。
3.  若为用户密钥，通知用户重新绑定。

### 5.3 审计与监控
*   `KeyManager` 内部维护一个环形缓冲区日志 (`auditLog`)，记录密钥访问情况 (成功/失败、来源)。
*   建议在生产环境对接 Sentry 或 LogRocket，上报 `KeyManager` 的异常日志 (注意脱敏，不上传 Key 内容)。

---

## 6. 安全审计检查表 (Checklist)

- [ ] **源码扫描**: 提交前运行 `git-secrets --scan` 确保无明文密钥。
- [ ] **CI/CD 注入**: 确认 Vercel 环境变量已配置，且未包含在构建产物 (`dist/`) 的静态文件中 (除必需的 Public Key)。
- [ ] **前端脱敏**: 确保 Log、Console 中不打印完整密钥。
- [ ] **HTTPS**: 生产环境强制开启 HTTPS，防止中间人窃取传输中的 Key。
- [ ] **最小依赖**: 定期检查 `package.json` 依赖，防止供应链攻击窃取 Env。
