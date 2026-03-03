# GitHub Pages 部署指南

## 📋 部署步骤

### 步骤 1: 创建 GitHub 仓库

1. 访问 https://github.com
2. 点击 "+" → "New repository"
3. 仓库名：`智能日历助手`（或你喜欢的名称）
4. 设置为 **Public**（公开）
5. 不要初始化 README（我们已有代码）
6. 点击 "Create repository"

### 步骤 2: 推送代码到 GitHub

```bash
# 初始化 Git（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "feat: 初始版本"

# 添加远程仓库（替换为你的 GitHub 用户名和仓库名）
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 推送到 main 分支
git branch -M main
git push -u origin main
```

### 步骤 3: 配置 GitHub Pages

1. 进入仓库页面 → 点击 **"Settings"**
2. 左侧菜单选择 **"Pages"**
3. **Source** 选择：**GitHub Actions**
4. 系统会自动识别工作流文件

### 步骤 4: 启用 GitHub Actions

1. 进入仓库页面 → 点击 **"Actions"** 标签
2. 如果看到提示 "I understand my workflows, go ahead and enable them"，点击确认
3. 第一次部署会自动触发，等待构建完成（约 2-3 分钟）

### 步骤 5: 获取访问地址

部署成功后，你的应用将在以下地址可访问：

```
https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
```

例如：
```
https://zhangsan.github.io/智能日历助手/
```

---

## 🔧 自定义域名（可选）

### 方式 1: 使用 GitHub 提供的域名（推荐）

**优势**：
- ✅ 无需备案
- ✅ 免费
- ✅ 配置简单
- ✅ 国内大部分地区可访问

**地址格式**：`https://用户名.github.io/仓库名`

### 方式 2: 绑定自己的域名

如果你有已备案的域名：

1. **DNS 配置**：
   ```
   类型    名称    值
   CNAME   www     用户名.github.io
   ```

2. **GitHub 配置**：
   - Settings → Pages → Custom domain
   - 输入你的域名：`www.yourdomain.com`
   - 勾选 "Enforce HTTPS"

3. **修改 vite.config.github.js**：
   ```javascript
   base: 'https://www.yourdomain.com/',
   ```

---

## 🎯 国内访问优化建议

### 1. 使用国内 CDN 加速静态资源

修改 `vite.config.github.js`，将大型库改为 CDN 引入：

```javascript
build: {
  rollupOptions: {
    external: ['vue', 'element-plus', 'axios'],
    output: {
      globals: {
        vue: 'Vue',
        'element-plus': 'ElementPlus',
        axios: 'axios'
      }
    }
  }
}
```

在 `index.html` 中添加 CDN 链接：

```html
<script src="https://cdn.jsdelivr.net/npm/vue@3"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/element-plus" />
```

### 2. 使用国内镜像源

如果 GitHub Pages 访问慢，可考虑：
- **Gitee Pages**（需要实名认证）
- **Coding Pages**（腾讯云）

---

## 📝 注意事项

### API 密钥配置

由于是纯前端应用，API 密钥会暴露在前端代码中。建议：

1. **使用用户自己的 API 密钥**：
   - 在设置页面让用户输入自己的密钥
   - 密钥存储在浏览器本地，不会上传

2. **限制 API 密钥权限**：
   - 在智谱 AI / OpenRouter 后台设置域名白名单
   - 限制每日使用额度

3. **使用代理（可选）**：
   - 部署 Cloudflare Workers 作为代理
   - 隐藏真实 API 密钥

### 访问速度优化

1. **代码分割**：已配置 Vite 自动分包
2. **Gzip 压缩**：已启用
3. **图片优化**：使用 WebP 格式
4. **懒加载**：路由和组件按需加载

---

## 🐛 常见问题

### 1. 页面空白或 404

**原因**：base 路径配置错误

**解决**：
```javascript
// vite.config.github.js
base: '/仓库名/', // 必须以 / 开头和结尾
```

### 2. 路由跳转后刷新 404

**原因**：GitHub Pages 不支持前端路由

**解决**：使用 hash 模式路由

```javascript
// src/router/modernRouter.js
import { createWebHashHistory } from 'vue-router';

const router = createRouter({
  history: createWebHashHistory(), // 使用 Hash 模式
  routes
});
```

### 3. API 请求失败（CORS）

**原因**：跨域限制

**解决**：
- 确保 API 支持 CORS
- 使用代理服务器
- 配置域名白名单

### 4. 国内访问慢

**解决方案**：
1. 使用 Gitee Pages（国内服务器）
2. 绑定自定义域名 + 国内 CDN
3. 使用 Cloudflare CDN 加速

---

## 🚀 自动部署

配置完成后，每次推送到 main 分支都会自动部署：

```bash
# 开发完成后
git add .
git commit -m "feat: 添加新功能"
git push origin main

# GitHub Actions 会自动构建并部署
```

---

## 📊 部署状态查看

1. **查看部署历史**：
   - Actions → Deploy to GitHub Pages
   - 查看每次部署的日志和状态

2. **查看访问统计**：
   - Settings → Pages → Traffic
   - 查看访问量和来源

---

## 💡 下一步

部署成功后，建议：

1. ✅ 测试所有功能是否正常
2. ✅ 在不同设备上测试访问
3. ✅ 配置自定义域名（可选）
4. ✅ 设置访问统计监控
5. ✅ 定期备份数据

---

## 📞 需要帮助？

如果部署过程中遇到问题：

1. 查看 GitHub Actions 日志
2. 检查浏览器控制台错误
3. 参考 GitHub Pages 官方文档
4. 查看项目 Issue

祝你部署成功！🎉
