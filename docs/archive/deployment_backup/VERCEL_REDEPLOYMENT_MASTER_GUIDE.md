# Vercel 重新部署全流程主指南 (Master Redeployment Guide)

**版本**: 1.0  
**最后更新**: 2026-03-01  
**适用对象**: 运维人员、开发人员  

---

## 1. 前置条件检查清单 (Prerequisites Checklist)

在开始重新部署前，请逐项确认以下条件已满足，以确保部署过程顺畅无阻。

| 检查项 | 要求 | 验证命令/操作 | 状态 |
| :--- | :--- | :--- | :--- |
| **Node.js 环境** | 本地版本需 >= 20.x (与 Vercel 保持一致) | `node -v` | □ |
| **Vercel CLI** | 已全局安装最新版 | `npm i -g vercel` -> `vercel --version` | □ |
| **Git 状态** | 本地代码已提交且工作区干净 | `git status` (应显示 clean) | □ |
| **Vercel 登录** | CLI 已登录对应账号 | `vercel login` | □ |
| **项目关联** | 本地已关联 Vercel 项目 | `vercel link` (检查 `.vercel/project.json`) | □ |
| **环境变量** | 已准备好所有必需的 API Key | 参考 `docs/guides/VERCEL_ENV_SETUP.md` | □ |

---

## 2. 代码与配置重置 (Reset & Sync)

### 2.1 校验核心配置文件
确保项目根目录存在 `vercel.json` 且配置正确，以支持 SPA 路由重写。

```bash
# 检查 vercel.json 是否存在且内容正确
cat vercel.json
```
*预期内容:*
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

### 2.2 同步远程仓库
确保本地代码与远程仓库 (GitHub/GitLab) 同步，避免部署旧代码。

```bash
git pull origin main
```

### 2.3 清理环境变量 (Vercel Side)
如果之前的部署存在环境变量混乱问题，建议先检查并清理无效变量。
*   进入 Vercel Dashboard -> Settings -> Environment Variables。
*   删除重复或错误的 Key。

---

## 3. 重新部署 (Redeployment)

提供两种部署通道，建议优先使用 **CLI 通道** 进行调试和强制部署，日常迭代使用 **Git 通道**。

### 通道 A: Vercel CLI (推荐用于修复问题)
使用 CLI 可以强制清理构建缓存，解决因缓存导致的诡异问题。

```bash
# 强制重新部署到生产环境 (跳过缓存)
vercel --prod --force
```
*   `--prod`: 部署到生产环境 (Production)。
*   `--force`: 强制重新构建，不使用之前的构建缓存。

### 通道 B: Git 集成 (推荐用于日常迭代)
只需将代码推送到主分支，Vercel 会自动触发部署。

```bash
git add .
git commit -m "fix: update deployment configuration"
git push origin main
```
*   **注意**: 若仅修改了 Vercel 环境变量，Git 推送**不会**自动触发重新部署。此时需在 Vercel Dashboard 中点击 `Redeploy` 或使用 CLI 通道。

---

## 4. 域名与 SSL 证书绑定

### 4.1 绑定自定义域名
1.  进入 Vercel Dashboard -> **Settings** -> **Domains**。
2.  输入你的域名 (如 `calendar.example.com`) 并点击 **Add**。
3.  根据提示在你的 DNS 服务商 (阿里云/腾讯云/Cloudflare) 添加记录：
    *   **A 记录**: 指向 `76.76.21.21` (推荐)
    *   **CNAME 记录**: 指向 `cname.vercel-dns.com`

### 4.2 SSL 证书验证
Vercel 会自动申请 Let's Encrypt 证书。
*   **状态检查**: 在 Domains 页面查看域名状态。
    *   🔵 `Configuring`: 等待 DNS 生效。
    *   🟢 `Valid`: SSL 证书已颁发，HTTPS 可用。
    *   🔴 `Invalid`: DNS 配置错误，需检查解析记录。

---

## 5. 部署监控与日志

### 5.1 实时构建日志
在 CLI 部署时，终端会实时输出日志。若使用 Git 部署，可使用 CLI 查看：

```bash
# 查看最近一次部署的日志 (即使不是你发起的)
vercel logs <deployment-url>
```
或者直接在 Dashboard 的 **Deployments** 页面点击查看。

### 5.2 运行时日志 (Runtime Logs)
查看应用运行时的报错（如 API 调用失败）。

```bash
# 查看生产环境实时日志
vercel logs --prod
```

---

## 6. 验证与测试 (Verification)

部署完成后，执行以下验证步骤。

### 6.1 自动化验证脚本
运行项目提供的验证脚本 (需确保已安装依赖)：

```bash
# 运行部署验证脚本
node scripts/verify-deployment.js <your-vercel-url>
```

### 6.2 手动回归测试
1.  **200 OK**: 访问首页，确保无白屏。
2.  **路由测试**: 访问 `/calendar`，然后**刷新页面**，确保不报 404。
3.  **API 测试**: 打开控制台 (F12)，进入“设置 -> API 管理”，填入 Key 进行测试。
4.  **功能测试**: 尝试创建一个日程，查看是否成功。

### 6.3 性能基线
在 Vercel Dashboard -> **Speed Insights** 查看真实用户数据，或使用 PageSpeed Insights 检测。
*   **LCP** (最大内容绘制) 应 < 2.5s
*   **FID** (首次输入延迟) 应 < 100ms

---

## 7. 回滚与故障排查

### 7.1 快速回滚 (Instant Rollback)
如果新版本出现严重 Bug，可立即回滚到上一个稳定版本（秒级生效）。

1.  进入 Vercel Dashboard -> **Deployments**。
2.  找到上一个状态为 🟢 `Ready` 的部署。
3.  点击 `...` -> **Promote to Production** (或 Instant Rollback)。

### 7.2 故障排查指南
*   **404 Not Found**: 检查 `vercel.json` 是否存在；检查 `dist/` 目录结构。
*   **500 Server Error**: 检查 Serverless Function 日志；检查环境变量是否读取成功。
*   **CORS Error**: 检查后端 API 的 `Access-Control-Allow-Origin` 设置。

---

## 8. 部署检查表 (Step-by-Step Checklist)

复制此表，按顺序打钩执行。

- [ ] **Step 1: 环境准备**
    - [ ] 本地 Node.js >= 20.x
    - [ ] `npm i -g vercel` 已安装
    - [ ] `vercel login` 已登录
- [ ] **Step 2: 配置确认**
    - [ ] `vercel.json` 存在且包含 rewrites 规则
    - [ ] `.vercelignore` 包含了 `mcp-services` (若不部署后端)
    - [ ] Vercel 后台 Environment Variables 已填好 (`VITE_AMAP_...`)
- [ ] **Step 3: 执行部署**
    - [ ] 执行 `vercel --prod --force`
    - [ ] 等待终端显示 `Production: https://... [copied to clipboard]`
- [ ] **Step 4: 验证**
    - [ ] 访问生产环境 URL
    - [ ] 刷新非根路径页面 (测试 SPA 路由)
    - [ ] 验证 API 功能 (地图/天气/AI)
- [ ] **Step 5: 收尾**
    - [ ] 提交代码到 Git
    - [ ] 通知团队部署完成
