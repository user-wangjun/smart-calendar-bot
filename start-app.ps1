# 智能日历助手 - PowerShell启动脚本
# Smart Calendar Launcher - PowerShell Startup Script

param(
    [switch]$SkipPortCheck = $false
)

# 设置错误处理
$ErrorActionPreference = "Stop"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Smart Calendar Launcher" -ForegroundColor Cyan
Write-Host "  智能日历助手 - 启动器" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# 切换到脚本所在目录
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptPath

# 检查Node.js
Write-Host "[INFO] Checking Node.js..." -ForegroundColor Yellow
$NodeVersion = node -v 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Node.js not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Node.js 16.0.0 or higher" -ForegroundColor Yellow
    Write-Host "Download: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadLine()
    exit 1
}
Write-Host "[SUCCESS] Node.js version: $NodeVersion" -ForegroundColor Green
Write-Host ""

# 检查npm
Write-Host "[INFO] Checking npm..." -ForegroundColor Yellow
$NpmVersion = npm -v 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] npm not found" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadLine()
    exit 1
}
Write-Host "[SUCCESS] npm version: $NpmVersion" -ForegroundColor Green
Write-Host ""

# 检查依赖
if (-not (Test-Path "node_modules")) {
    Write-Host "[INFO] Installing dependencies..." -ForegroundColor Yellow
    Write-Host ""
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "[ERROR] Failed to install dependencies" -ForegroundColor Red
        Write-Host ""
        Read-Host "Press any key to exit..."
        $null = $Host.UI.RawUI.ReadLine()
        exit 1
    }
    Write-Host ""
    Write-Host "[SUCCESS] Dependencies installed" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[SUCCESS] Dependencies already installed" -ForegroundColor Green
    Write-Host ""
}

# 检查端口占用（除非跳过）
if (-not $SkipPortCheck) {
    Write-Host "[INFO] Checking port 5173..." -ForegroundColor Yellow
    $PortProcess = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($PortProcess) {
        $ProcessId = $PortProcess.OwningProcess
        Write-Host "[WARNING] Port 5173 is in use by PID $ProcessId" -ForegroundColor Yellow
        Write-Host "[INFO] Killing process $ProcessId..." -ForegroundColor Yellow
        Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    } else {
        Write-Host "[SUCCESS] Port 5173 is available" -ForegroundColor Green
    }
    Write-Host ""
}

# 启动应用
Write-Host "[INFO] Starting application..." -ForegroundColor Cyan
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  URL: http://127.0.0.1:5173" -ForegroundColor White
Write-Host "  Press Ctrl+C to stop server" -ForegroundColor White
Write-Host "  Close this window to stop server" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# 使用Node.js启动器
node launcher.js

# 检查启动结果
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[WARNING] Launcher failed, trying direct start..." -ForegroundColor Yellow
    Write-Host ""
    npm run dev
}

# 如果直接启动也失败
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host "[ERROR] Failed to start" -ForegroundColor Red
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Ensure Node.js 16.0.0 or higher is installed" -ForegroundColor White
    Write-Host "  2. Check network connection" -ForegroundColor White
    Write-Host "  3. Ensure port 7000 is not in use" -ForegroundColor White
    Write-Host "  4. Try deleting node_modules folder and restart" -ForegroundColor White
    Write-Host "  5. Check firewall or antivirus settings" -ForegroundColor White
    Write-Host "  6. Try running: npm run dev directly" -ForegroundColor White
    Write-Host ""
    Write-Host "For detailed logs, check terminal output above" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadLine()
    exit 1
}

Write-Host ""
Write-Host "[SUCCESS] Application started!" -ForegroundColor Green
Write-Host "Opening browser..." -ForegroundColor Green
Start-Sleep -Seconds 2
Start-Process "http://127.0.0.1:7000"
