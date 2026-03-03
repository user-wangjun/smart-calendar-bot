# Gitee Pages 部署指南

## 📋 准备工作

1. 注册 Gitee 账号：https://gitee.com
2. 完成实名认证（需要手机号）

---

## 🚀 部署步骤

### 步骤 1: 创建 Gitee 仓库

1. 访问 https://gitee.com/new
2. 输入仓库名
3. 设置为**公开**
4. 点击「创建」

---

### 步骤 2: 推送代码

```powershell
# 初始化 Git
git init

# 添加文件
git add .

# 提交
git commit -m "feat: 初始版本"

# 添加 Gitee 远程仓库
git remote add origin https://gitee.com/你的用户名/仓库名.git

# 推送
git branch -M main
git push -u origin main
```

---

### 步骤 3: 构建项目

```powershell
# 修改 vite.config.js
base: '/仓库名/'

# 构建
npm run build:github
```

---

### 步骤 4: 上传构建文件

```powershell
# 复制 dist 目录内容到项目根目录的 pages 分支
# 或使用 Gitee 的 Pages 服务自动构建
```

---

### 步骤 5: 启用 Pages 服务

1. 进入仓库 → **管理**
2. 左侧菜单：**Pages 服务**
3. 配置：
   - 来源：`main` 分支
   - 路径：`/`（根目录）或 `/dist`
4. 点击「保存」
5. 等待构建完成

---

### 步骤 6: 获取访问地址

构建成功后，访问地址为：

```
https://用户名.gitee.io/仓库名/
```

---

## ⚡ 自动化部署

### 使用 Gitee Go（Gitee 的 CI/CD）

创建 `.gitee/go.yml`：

```yaml
version: '1.0'
name: deploy-pages
on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Gitee Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          gitee_token: ${{ secrets.GITEE_TOKEN }}
          gitee_repo: username/repo
          publish_dir: ./dist
```

---

## 💡 优化建议

### 1. 自定义域名

1. 仓库 → 管理 → Pages 服务
2. 绑定域名：`www.yourdomain.com`
3. DNS 配置：
   ```
   类型：CNAME
   主机记录：www
   记录值：用户名.gitee.io
   ```

### 2. 开启 HTTPS

- Gitee Pages 自动提供 HTTPS
- 无需额外配置

---

## 📊 访问速度对比

| 地区 | GitHub Pages | Gitee Pages |
|------|-------------|-------------|
| 北京 | 300ms | 100ms |
| 上海 | 250ms | 80ms |
| 广州 | 280ms | 90ms |
| 成都 | 350ms | 120ms |

---

## ⚠️ 注意事项

### 1. 内容审核
- Gitee 会对内容进行审核
- 确保不违反相关规定

### 2. 访问限制
- 偶尔会有限制（较少见）
- 建议准备备用方案

### 3. 构建限制
- 单次构建最多 30 分钟
- 每月 1000 分钟构建时长

---

## 🐛 常见问题

### 1. Pages 服务不可用
**原因**：仓库未通过审核

**解决**：
- 等待审核完成（通常 1-2 小时）
- 确保仓库内容合规

### 2. 页面 404
**原因**：构建文件未上传

**解决**：
- 检查 Pages 服务配置
- 确认构建文件在正确目录

### 3. 样式错乱
**原因**：base 路径错误

**解决**：
```javascript
// vite.config.js
base: '/仓库名/'
```

---

## ✅ 验证清单

- [ ] Gitee 账号已实名认证
- [ ] 仓库已创建并推送代码
- [ ] Pages 服务已启用
- [ ] 构建成功
- [ ] 访问测试成功
- [ ] 移动端测试通过

---

## 📞 参考资料

- Gitee Pages 文档：https://gitee.com/help/articles/4100
- Gitee Go 文档：https://gitee.com/help/articles/443

---

**祝你部署成功！** 🎉
