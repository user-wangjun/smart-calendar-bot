# Gitee Pages 一键部署脚本
# 适用于 Windows PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Gitee Pages 部署工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Git 是否安装
Write-Host "[1/5] 检查 Git 安装..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "✓ Git 已安装：$gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Git 未安装，请先安装 Git: https://git-scm.com/" -ForegroundColor Red
    exit 1
}

# 检查是否已初始化 Git 仓库
Write-Host ""
Write-Host "[2/5] 检查 Git 仓库状态..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Write-Host "✓ Git 仓库已初始化" -ForegroundColor Green
} else {
    Write-Host "  正在初始化 Git 仓库..." -ForegroundColor Cyan
    git init
    Write-Host "✓ Git 仓库初始化完成" -ForegroundColor Green
}

# 检查远程仓库配置
Write-Host ""
Write-Host "[3/5] 检查远程仓库配置..." -ForegroundColor Yellow
$remoteUrl = git remote get-url origin 2>$null
if ($remoteUrl) {
    Write-Host "✓ 远程仓库已配置：$remoteUrl" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠ 未配置远程仓库" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "请输入你的 Gitee 仓库信息：" -ForegroundColor Cyan
    Write-Host ""
    
    # 获取用户名
    $username = Read-Host "Gitee 用户名"
    if ([string]::IsNullOrWhiteSpace($username)) {
        Write-Host "✗ 用户名不能为空" -ForegroundColor Red
        exit 1
    }
    
    # 获取仓库名
    $repoName = Read-Host "仓库名称"
    if ([string]::IsNullOrWhiteSpace($repoName)) {
        Write-Host "✗ 仓库名不能为空" -ForegroundColor Red
        exit 1
    }
    
    # 添加远程仓库
    $remoteUrl = "https://gitee.com/$username/$repoName.git"
    git remote add origin $remoteUrl
    Write-Host "✓ 远程仓库已添加：$remoteUrl" -ForegroundColor Green
}

# 构建项目
Write-Host ""
Write-Host "[4/5] 构建项目..." -ForegroundColor Yellow
Write-Host "  正在构建 Gitee Pages 版本..." -ForegroundColor Cyan

# 检查 vite.config.js 中的 base 配置
Write-Host ""
Write-Host "⚠ 请确保 vite.config.js 中的 base 配置正确：" -ForegroundColor Yellow
Write-Host "   base: '/仓库名/'" -ForegroundColor Cyan
Write-Host ""

$continue = Read-Host "是否继续构建？(y/n)"
if ($continue -ne 'y') {
    exit 0
}

npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ 构建失败" -ForegroundColor Red
    exit 1
}
Write-Host "✓ 构建完成" -ForegroundColor Green

# 添加所有文件到 Git
Write-Host ""
Write-Host "[5/5] 准备提交代码..." -ForegroundColor Yellow
git add .
$changes = git status --porcelain
if ($changes.Count -eq 0) {
    Write-Host "  没有需要提交的更改" -ForegroundColor Cyan
} else {
    Write-Host "  发现以下更改:" -ForegroundColor Cyan
    git status --short
    Write-Host ""
    $commitMessage = Read-Host "输入提交信息 (默认：deploy to gitee)"
    if ([string]::IsNullOrWhiteSpace($commitMessage)) {
        $commitMessage = "deploy to gitee"
    }
    git commit -m $commitMessage
    Write-Host "✓ 代码提交完成" -ForegroundColor Green
}

# 推送到 Gitee
Write-Host ""
Write-Host "正在推送到 Gitee..." -ForegroundColor Cyan

# 检查分支
$currentBranch = git branch --show-current
if ([string]::IsNullOrWhiteSpace($currentBranch)) {
    $currentBranch = "main"
    git branch -M main
}

git push -u origin $currentBranch

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ 推送失败，请检查：" -ForegroundColor Red
    Write-Host "  1. Gitee 账号密码是否正确" -ForegroundColor Yellow
    Write-Host "  2. 是否开启双重验证（需使用私人令牌）" -ForegroundColor Yellow
    Write-Host "  3. 网络连接是否正常" -ForegroundColor Yellow
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
Write-Host "1. 进入仓库页面" -ForegroundColor White
Write-Host "   点击以下链接（按 Ctrl+ 点击打开）：" -ForegroundColor Gray
Write-Host "   $remoteUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. 启用 Pages 服务" -ForegroundColor White
Write-Host "   - 点击 '管理' 标签" -ForegroundColor Gray
Write-Host "   - 左侧菜单选择 'Pages 服务'" -ForegroundColor Gray
Write-Host "   - 配置：" -ForegroundColor Gray
Write-Host "     * 来源分支：main" -ForegroundColor Gray
Write-Host "     * 发布目录：/" -ForegroundColor Gray
Write-Host "   - 点击 '保存'" -ForegroundColor Gray
Write-Host ""
Write-Host "3. 等待构建完成（1-3 分钟）" -ForegroundColor White
Write-Host "   - 首次使用需要审核（1-2 小时）" -ForegroundColor Gray
Write-Host ""
Write-Host "4. 访问你的应用" -ForegroundColor White
Write-Host "   格式：https://用户名.gitee.io/仓库名/" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 提示：" -ForegroundColor Yellow
Write-Host "  - 如果开启双重验证，需要使用私人令牌" -ForegroundColor Gray
Write-Host "  - 私人令牌获取：个人设置 → 安全设置 → 私人令牌" -ForegroundColor Gray
Write-Host ""
Write-Host "🎉 祝你部署成功！" -ForegroundColor Green
Write-Host ""
