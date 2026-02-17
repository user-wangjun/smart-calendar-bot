@echo off
setlocal enabledelayedexpansion

title Smart Calendar Launcher

cd /d "%~dp0"

echo.
echo ============================================================
echo   Smart Calendar Launcher
echo   Intelligent Calendar Assistant
echo ============================================================
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found
    echo.
    echo Please install Node.js 16.0.0 or higher
    echo Download: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [INFO] Node.js version:
node -v
echo.

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm not found
    echo.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo [INFO] Installing dependencies...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Failed to install dependencies
        echo.
        pause
        exit /b 1
    )
    echo.
    echo [SUCCESS] Dependencies installed
    echo.
) else (
    echo [SUCCESS] Dependencies already installed
    echo.
)

echo [INFO] Checking port 5173...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173 "') do (
    if not "%%a"=="" (
        if "%%a" neq "0" (
            echo [WARNING] Port 5173 is in use by PID %%a
            echo [INFO] Killing process %%a...
            taskkill /F /PID %%a >nul 2>&1
            timeout /t 2 /nobreak >nul
        )
    )
)

echo [INFO] Starting application...
echo.
echo ============================================================
echo   URL: http://127.0.0.1:5173
echo   Press Ctrl+C to stop server
echo   Close this window to stop server
echo ============================================================
echo.

node launcher.js

if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Launcher failed, trying direct start...
    echo.
    call npm run dev
)

if %errorlevel% neq 0 (
    echo.
    echo ============================================================
    echo [ERROR] Failed to start
    echo ============================================================
    echo.
    echo Troubleshooting:
    echo   1. Ensure Node.js 16.0.0 or higher is installed
    echo   2. Check network connection
    echo   3. Ensure port 5173 is not in use
    echo   4. Try deleting node_modules folder and restart
    echo   5. Check firewall or antivirus settings
    echo   6. Try running: npm run dev directly
    echo.
    pause
    exit /b 1
)

pause
