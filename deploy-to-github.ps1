# GitHub Pages 一键部署脚本
# 适用于 Windows PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  智能日历助手 - GitHub Pages 部署工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Git 是否安装
Write-Host "[1/6] 检查 Git 安装..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "✓ Git 已安装：$gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Git 未安装，请先安装 Git: https://git-scm.com/" -ForegroundColor Red
    exit 1
}

# 检查是否已初始化 Git 仓库
Write-Host ""
Write-Host "[2/6] 检查 Git 仓库状态..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Write-Host "✓ Git 仓库已初始化" -ForegroundColor Green
} else {
    Write-Host "  正在初始化 Git 仓库..." -ForegroundColor Cyan
    git init
    Write-Host "✓ Git 仓库初始化完成" -ForegroundColor Green
}

# 检查远程仓库配置
Write-Host ""
Write-Host "[3/6] 检查远程仓库配置..." -ForegroundColor Yellow
$remoteUrl = git remote get-url origin 2>$null
if ($remoteUrl) {
    Write-Host "✓ 远程仓库已配置：$remoteUrl" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠ 未配置远程仓库" -ForegroundColor Yellow
    Write-Host "请在 GitHub 创建仓库后，执行以下命令：" -ForegroundColor Cyan
    Write-Host "  git remote add origin https://github.com/用户名/仓库名.git" -ForegroundColor White
    Write-Host ""
    $continue = Read-Host "是否继续？(y/n)"
    if ($continue -ne 'y') {
        exit 0
    }
}

# 构建项目
Write-Host ""
Write-Host "[4/6] 构建项目..." -ForegroundColor Yellow
Write-Host "  正在构建 GitHub Pages 版本..." -ForegroundColor Cyan

npm run build:github

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ 构建失败" -ForegroundColor Red
    exit 1
}
Write-Host "✓ 构建完成" -ForegroundColor Green

# 添加所有文件到 Git
Write-Host ""
Write-Host "[5/6] 准备提交代码..." -ForegroundColor Yellow
git add .
$changes = git status --porcelain
if ($changes.Count -eq 0) {
    Write-Host "  没有需要提交的更改" -ForegroundColor Cyan
} else {
    Write-Host "  发现以下更改:" -ForegroundColor Cyan
    git status --short
    Write-Host ""
    $commitMessage = Read-Host "输入提交信息 (默认：deploy: 部署到 GitHub Pages)"
    if ([string]::IsNullOrWhiteSpace($commitMessage)) {
        $commitMessage = "deploy: 部署到 GitHub Pages"
    }
    git commit -m $commitMessage
    Write-Host "✓ 代码提交完成" -ForegroundColor Green
}

# 推送到 GitHub
Write-Host ""
Write-Host "[6/6] 推送到 GitHub..." -ForegroundColor Yellow
Write-Host "  正在推送代码到远程仓库..." -ForegroundColor Cyan

# 检查分支
$currentBranch = git branch --show-current
if ([string]::IsNullOrWhiteSpace($currentBranch)) {
    $currentBranch = "main"
    git branch -M main
}

git push -u origin $currentBranch

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ 推送失败，请检查网络连接或远程仓库配置" -ForegroundColor Red
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
Write-Host "1. 在 GitHub 仓库中启用 GitHub Actions:" -ForegroundColor White
Write-Host "   - 进入仓库页面 → 点击 'Actions' 标签" -ForegroundColor Gray
Write-Host "   - 点击 'I understand my workflows, go ahead and enable them'" -ForegroundColor Gray
Write-Host ""
Write-Host "2. 配置 GitHub Pages:" -ForegroundColor White
Write-Host "   - Settings → Pages" -ForegroundColor Gray
Write-Host "   - Source 选择 'GitHub Actions'" -ForegroundColor Gray
Write-Host ""
Write-Host "3. 等待部署完成（约 2-3 分钟）" -ForegroundColor White
Write-Host "   - Actions 标签查看部署进度" -ForegroundColor Gray
Write-Host ""
Write-Host "4. 访问你的应用:" -ForegroundColor White
Write-Host "   https://用户名.github.io/仓库名/" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 祝你部署成功！" -ForegroundColor Green
Write-Host ""
