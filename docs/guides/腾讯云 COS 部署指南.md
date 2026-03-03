# 腾讯云 COS 部署指南

## 📋 准备工作

### 1. 准备域名
- 购买域名（约 30-60 元/年）
- 完成 ICP 备案（7-20 个工作日）

### 2. 注册腾讯云账号
- 访问 https://cloud.tencent.com
- 完成实名认证

---

## 🚀 部署步骤

### 步骤 1: 创建存储桶

1. 访问 **对象存储 COS 控制台**
2. 点击「创建存储桶」
3. 配置：
   - 名称：`calendar-1234567890`（全局唯一）
   - 地域：选择离用户近的地域（如广州、上海）
   - 访问权限：**公有读私有写**
4. 点击「确认」

---

### 步骤 2: 配置静态网站托管

1. 进入存储桶 → **基础配置**
2. 找到「静态网站托管」
3. 点击「编辑」：
   - 启用：**是**
   - 索引文档：`index.html`
   - 错误文档：`index.html`
4. 保存配置

---

### 步骤 3: 构建项目

```powershell
# 修改 vite.config.js
base: '/',  # 使用根路径

# 构建项目
npm run build
```

---

### 步骤 4: 上传文件

#### 方式 A: 使用控制台（推荐新手）

1. 进入存储桶 → **文件列表**
2. 点击「上传文件」
3. 选择 `dist/` 目录下的所有文件
4. 等待上传完成

#### 方式 B: 使用命令行工具

```powershell
# 安装 COSCLI
pip install coscli

# 配置（首次运行）
coscli config

# 上传文件
coscli cp dist/ cos://bucket-name/ -r
```

---

### 步骤 5: 绑定自定义域名

1. 进入存储桶 → **域名管理**
2. 点击「添加域名」
3. 输入你的已备案域名：`www.yourdomain.com`
4. 按提示配置 CNAME 记录

**DNS 配置**（在域名服务商处）：
```
类型：CNAME
主机记录：www
记录值：bucket-1234567890.cos.gz.myqcloud.com
```

---

### 步骤 6: 配置 CDN 加速（可选但推荐）

1. 进入 **CDN 控制台**
2. 添加域名：`www.yourdomain.com`
3. 配置：
   - 加速区域：**中国大陆**
   - 业务类型：**下载加速**
   - 源站类型：**COS 源站**
   - 源站地址：选择你的存储桶
4. 配置 HTTPS 证书（免费）：
   - SSL 证书：申请免费证书
   - 强制跳转：HTTP → HTTPS

---

## 💰 费用说明

### 免费额度（每月）
- 存储空间：50 GB
- 下行流量：10 GB
- 请求次数：100 万次

### 超出后费用
- 存储：0.13 元/GB/月
- 流量：0.2-0.5 元/GB
- 请求：0.01 元/万次

### 实际案例
**月活 1000 人的日历应用**：
- 存储：1 GB → 0.13 元
- 流量：50 GB → 15 元
- 请求：10 万次 → 0.1 元
- **总计**：约 15-20 元/月

---

## 🔧 自动化部署脚本

创建 `deploy-to-cos.ps1`：

```powershell
# 构建项目
Write-Host "构建项目..." -ForegroundColor Cyan
npm run build

# 使用 COSCLI 上传
Write-Host "上传到 COS..." -ForegroundColor Cyan
coscli cp dist/ cos://calendar-1234567890/ -r

Write-Host "部署完成！" -ForegroundColor Green
Write-Host "访问地址：https://www.yourdomain.com" -ForegroundColor Cyan
```

---

## ✅ 验证清单

- [ ] 域名已备案成功
- [ ] 存储桶创建成功
- [ ] 静态网站托管已启用
- [ ] 文件上传完成
- [ ] CNAME 记录已配置
- [ ] CDN 加速已配置
- [ ] HTTPS 证书已签发
- [ ] 访问测试成功

---

## 🐛 常见问题

### 1. 访问显示 403 Forbidden
**原因**：存储桶权限设置错误

**解决**：
- 确保访问权限为「公有读私有写」
- 检查域名白名单配置

### 2. 页面空白
**原因**：base 路径配置错误

**解决**：
```javascript
// vite.config.js
base: '/'  // 使用根路径
```

### 3. CDN 缓存问题
**解决**：
- CDN 控制台 → 刷新缓存
- 或设置缓存规则：HTML 文件不缓存

---

## 📊 性能优化建议

### 1. 开启 Gzip 压缩
- CDN 控制台 → 智能压缩
- 开启 Gzip：是

### 2. 配置浏览器缓存
```
图片/视频：30 天
CSS/JS：7 天
HTML：不缓存
```

### 3. 使用 HTTP/2
- CDN 控制台 → 高级配置
- HTTP/2：开启

---

## 🎯 下一步

1. ✅ 购买域名并备案
2. ✅ 创建 COS 存储桶
3. ✅ 上传构建文件
4. ✅ 绑定域名
5. ✅ 配置 CDN
6. ✅ 测试访问

---

## 📞 技术支持

- 腾讯云文档：https://cloud.tencent.com/document/product/436
- COSCLI 文档：https://cloud.tencent.com/document/product/436/61299

---

**祝你部署成功！** 🎉
