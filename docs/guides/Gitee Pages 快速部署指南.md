# Gitee Pages 快速部署指南

## 📋 部署要求

### 1. 账号要求
- ✅ 注册 Gitee 账号：https://gitee.com
- ✅ 完成实名认证（需要中国大陆手机号 +1）
- ✅ 建议绑定邮箱

### 2. 仓库要求
- ✅ 必须是**公开仓库**
- ✅ 内容合规（通过审核）
- ✅ 静态网站（纯前端项目）

### 3. 技术限制
- ⚠️ 存储空间：最大 500MB
- ⚠️ 每月流量：10GB
- ⚠️ 构建时长：每月 1000 分钟
- ⚠️ 单次构建：最多 30 分钟

---

## 🎯 部署步骤

### 步骤 1: 注册 Gitee 账号（2 分钟）

1. 访问 https://gitee.com
2. 点击「注册」
3. 使用手机号或邮箱注册
4. 验证邮箱/手机

---

### 步骤 2: 完成实名认证（3 分钟）

1. 点击右上角头像 →「个人设置」
2. 左侧菜单选择「实名认证」
3. 选择「个人认证」
4. 填写信息：
   - 真实姓名
   - 身份证号码
   - 手机号码
5. 提交审核（通常立即通过）

---

### 步骤 3: 创建仓库（2 分钟）

1. 访问 https://gitee.com/new
2. 填写信息：
   - **仓库名称**：`smart-calendar`（英文或数字）
   - **介绍**：智能日历助手
   - **开源协议**：MIT
   - **是否公开**：✅ 公开
   - **初始化**：❌ 不要勾选「使用 README 初始化」
3. 点击「创建」

---

### 步骤 4: 推送代码到 Gitee（3 分钟）

打开 PowerShell，在项目根目录执行：

```powershell
# 1. 初始化 Git（如果还没有）
git init

# 2. 添加所有文件
git add .

# 3. 提交
git commit -m "feat: 初始版本"

# 4. 添加 Gitee 远程仓库
# 替换为你的用户名和仓库名
git remote add origin https://gitee.com/你的用户名/smart-calendar.git

# 5. 推送到 Gitee
git branch -M main
git push -u origin main
```

**注意**：
- 推送时会要求输入 Gitee 账号密码
- 如果开启双重验证，需要使用私人令牌

---

### 步骤 5: 构建项目（1 分钟）

```powershell
# 修改 vite.config.js
# 确保 base 路径正确
base: '/smart-calendar/'

# 构建项目
npm run build
```

---

### 步骤 6: 启用 Pages 服务（2 分钟）

1. 进入你的仓库页面
2. 点击顶部菜单「**管理**」
3. 左侧菜单选择「**Pages 服务**」
4. 配置：
   - **来源分支**：`main`
   - **发布目录**：`/`（根目录）
5. 点击「**保存**」
6. 等待构建完成（1-3 分钟）

---

### 步骤 7: 获取访问地址

构建成功后，你会看到：

```
✅ Pages 服务已启用

访问地址：
https://你的用户名.gitee.io/smart-calendar/
```

点击即可访问！

---

## ⚡ 一键部署脚本

创建 `deploy-to-gitee.ps1`：

```powershell
# Gitee Pages 一键部署脚本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Gitee Pages 部署工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Git
Write-Host "[1/4] 检查 Git..." -ForegroundColor Yellow
try {
    git --version | Out-Null
    Write-Host "✓ Git 已安装" -ForegroundColor Green
} catch {
    Write-Host "✗ Git 未安装" -ForegroundColor Red
    exit 1
}

# 构建项目
Write-Host ""
Write-Host "[2/4] 构建项目..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ 构建失败" -ForegroundColor Red
    exit 1
}
Write-Host "✓ 构建完成" -ForegroundColor Green

# 推送代码
Write-Host ""
Write-Host "[3/4] 推送代码..." -ForegroundColor Yellow
git add .
$changes = git status --porcelain
if ($changes.Count -eq 0) {
    Write-Host "  没有需要提交的更改" -ForegroundColor Cyan
} else {
    $commitMessage = Read-Host "输入提交信息 (默认：deploy to gitee)"
    if ([string]::IsNullOrWhiteSpace($commitMessage)) {
        $commitMessage = "deploy to gitee"
    }
    git commit -m $commitMessage
}

git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ 推送失败" -ForegroundColor Red
    exit 1
}
Write-Host "✓ 推送成功" -ForegroundColor Green

# 完成
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  部署完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📦 下一步操作：" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. 进入仓库管理页面" -ForegroundColor White
Write-Host "   https://gitee.com/你的用户名/smart-calendar" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. 启用 Pages 服务" -ForegroundColor White
Write-Host "   管理 → Pages 服务 → 保存" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. 等待构建完成（1-3 分钟）" -ForegroundColor White
Write-Host ""
Write-Host "4. 访问你的应用" -ForegroundColor White
Write-Host "   https://你的用户名.gitee.io/smart-calendar/" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 祝你部署成功！" -ForegroundColor Green
Write-Host ""
```

---

## 🔧 自定义域名（可选）

### 1. 在 Gitee 绑定域名

1. 仓库 → 管理 → Pages 服务
2. 点击「绑定域名」
3. 输入你的域名：`www.yourdomain.com`
4. 点击「保存」

### 2. 配置 DNS

在域名服务商处添加 CNAME 记录：

```
类型：CNAME
主机记录：www
记录值：你的用户名.gitee.io
```

### 3. 等待生效

DNS 生效时间：5 分钟 - 24 小时

---

## 📊 访问速度对比

| 地区 | GitHub Pages | Gitee Pages |
|------|-------------|-------------|
| 北京 | 300-500ms | **80-150ms** |
| 上海 | 250-400ms | **70-120ms** |
| 广州 | 280-450ms | **90-140ms** |
| 成都 | 350-600ms | **100-180ms** |
| 西安 | 400-700ms | **120-200ms** |

---

## ⚠️ 注意事项

### 1. 内容审核

- Gitee 会对仓库内容进行审核
- 首次启用 Pages 服务时审核
- 审核时间：1-2 小时
- 确保内容合规（政治、色情、暴力等）

### 2. 访问限制

- 偶尔会有限制（较少见）
- 建议准备备用方案（GitHub Pages）

### 3. 构建失败处理

**常见原因**：
- 构建超时（>30 分钟）
- 依赖安装失败
- 磁盘空间不足

**解决方法**：
- 本地构建后上传 dist 目录
- 使用 CDN 引入大型依赖

---

## 🐛 常见问题

### Q1: 实名认证失败怎么办？

**A**: 
- 确保身份证信息正确
- 手机号必须是本人
- 联系客服：service@gitee.com

---

### Q2: Pages 服务一直审核中？

**A**:
- 正常审核时间 1-2 小时
- 如果超过 24 小时，联系客服
- 检查仓库内容是否合规

---

### Q3: 页面显示 404？

**A**:
1. 检查 Pages 服务是否启用
2. 确认构建是否成功
3. 检查 base 路径配置
4. 等待 2-3 分钟

---

### Q4: 样式错乱/资源加载失败？

**A**:
```javascript
// vite.config.js
// 确保 base 路径与仓库名一致
base: '/smart-calendar/'
```

---

### Q5: 如何更新代码？

**A**:
```powershell
# 修改代码后
git add .
git commit -m "feat: 更新功能"
git push origin main

# Gitee Pages 会自动重新构建
```

---

## ✅ 验证清单

部署完成后，请检查：

- [ ] Gitee 账号已实名认证
- [ ] 仓库已创建（公开）
- [ ] 代码已推送
- [ ] Pages 服务已启用
- [ ] 构建成功（绿色状态）
- [ ] 访问测试成功
- [ ] 移动端响应式正常
- [ ] 所有功能正常

---

## 📞 技术支持

### Gitee 官方联系方式

- **帮助中心**：https://gitee.com/help
- **在线客服**：工作日 9:00-18:00
- **邮箱**：service@gitee.com
- **电话**：400-659-0055

### 相关文档

- [Gitee Pages 官方文档](https://gitee.com/help/articles/4100)
- [Gitee Go 持续集成](https://gitee.com/help/articles/443)
- [Gitee 实名认证](https://gitee.com/help/articles/400)

---

## 🎯 总结

### 优势
- ✅ 国内访问速度快（100-200ms）
- ✅ 无需 ICP 备案
- ✅ 完全免费
- ✅ 中文界面
- ✅ 配置简单

### 劣势
- ⚠️ 需要实名认证
- ⚠️ 内容需要审核
- ⚠️ 偶尔有限制

### 推荐指数：⭐⭐⭐⭐⭐

**适合场景**：
- 个人项目
- 开源项目
- 需要国内快速访问
- 不想备案

---

**祝你部署成功！** 🎉

如有问题，欢迎查看文档或联系客服。
