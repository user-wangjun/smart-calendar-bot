# 🚀 快速部署指南 - 5 分钟搞定

## 前提条件

- ✅ 已安装 Node.js 20+
- ✅ 已安装 Git
- ✅ 有 GitHub 账号

---

## 步骤 1: 创建 GitHub 仓库（1 分钟）

1. 访问 https://github.com/new
2. 输入仓库名：`smart-calendar`（或你喜欢的名称）
3. 设置为 **Public**（公开）
4. **不要**勾选 "Initialize this repository with a README"
5. 点击 "Create repository"

---

## 步骤 2: 推送代码到 GitHub（2 分钟）

打开 PowerShell，在项目根目录执行：

```powershell
# 1. 初始化 Git（如果还没有）
git init

# 2. 添加所有文件
git add .

# 3. 提交
git commit -m "feat: 初始版本"

# 4. 添加远程仓库（替换为你的用户名和仓库名）
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 5. 推送
git branch -M main
git push -u origin main
```

---

## 步骤 3: 配置 GitHub Pages（1 分钟）

1. 进入你的 GitHub 仓库页面
2. 点击 **"Settings"** 标签
3. 左侧菜单选择 **"Pages"**
4. **Source** 选择：**GitHub Actions**
5. 完成！

---

## 步骤 4: 启用自动部署（1 分钟）

1. 点击 **"Actions"** 标签
2. 如果看到提示，点击 **"I understand my workflows, go ahead and enable them"**
3. 第一次部署会自动开始（约 2-3 分钟）
4. 等待显示绿色 ✅ 表示部署成功

---

## 🎉 完成！

部署成功后，访问：

```
https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
```

例如：
```
https://zhangsan.github.io/smart-calendar/
```

---

## ⚡ 一键部署（可选）

如果已经配置好 Git 远程仓库，可以直接运行：

```powershell
.\deploy-to-github.ps1
```

---

## 📝 后续更新

每次修改代码后：

```bash
git add .
git commit -m "feat: 添加新功能"
git push origin main
```

GitHub Actions 会自动构建并部署！

---

## 🐛 遇到问题？

### 页面空白
- 检查 `vite.config.js` 中的 `base` 路径
- 确保与仓库名一致：`base: '/仓库名/'`

### 404 错误
- 等待 2-3 分钟，部署需要时间
- 检查 Actions 标签查看部署状态

### 样式错乱
- 清除浏览器缓存
- 使用 Ctrl+F5 强制刷新

---

## 📚 详细文档

- [完整部署指南](./docs/guides/GitHub%20Pages%20部署指南.md)
- [部署方案对比](./docs/guides/部署方案总结.md)

---

**就这么简单！** 🎊
