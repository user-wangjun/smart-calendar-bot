import { spawn, exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 颜色输出函数
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

// 日志输出函数
function log (message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 检查Node.js和npm版本
function checkNodeVersion () {
  log('📋 检查环境依赖...', 'cyan');

  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

  if (majorVersion < 16) {
    log(`❌ Node.js版本过低: ${nodeVersion}`, 'red');
    log('   请升级到Node.js 16.0.0或更高版本', 'yellow');
    return false;
  }

  log(`✅ Node.js版本: ${nodeVersion}`, 'green');
  return true;
}

// 检查node_modules是否存在
function checkDependencies () {
  const nodeModulesPath = path.join(__dirname, 'node_modules');
  return fs.existsSync(nodeModulesPath);
}

// 安装依赖
function installDependencies () {
  return new Promise((resolve, reject) => {
    log('📦 正在安装依赖，请稍候...', 'yellow');

    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const install = spawn(npmCmd, ['install'], {
      cwd: __dirname,
      shell: process.platform === 'win32',
      env: { ...process.env }
    });

    // 将输出重定向到控制台
    install.stdout.pipe(process.stdout);
    install.stderr.pipe(process.stderr);

    install.on('close', (code) => {
      if (code === 0) {
        log('✅ 依赖安装完成', 'green');
        resolve();
      } else {
        log('❌ 依赖安装失败', 'red');
        reject(new Error('依赖安装失败'));
      }
    });

    install.on('error', (err) => {
      log(`❌ 安装依赖时出错: ${err.message}`, 'red');
      reject(err);
    });
  });
}

// 启动开发服务器
function startDevServer () {
  return new Promise((resolve, reject) => {
    log('🚀 正在启动开发服务器...', 'cyan');

    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const devServer = spawn(npmCmd, ['run', 'dev'], {
      cwd: __dirname,
      shell: process.platform === 'win32',
      env: { ...process.env }
    });

    // 将输出重定向到控制台
    devServer.stdout.pipe(process.stdout);
    devServer.stderr.pipe(process.stderr);

    // 等待服务器启动
    let serverStarted = false;
    const startupTimeout = setTimeout(() => {
      if (!serverStarted) {
        log('⚠️ 服务器启动超时（30秒），请检查以下问题：', 'yellow');
        log('  1. 端口5174是否被占用', 'yellow');
        log('  2. 防火墙或安全软件是否阻止了连接', 'yellow');
        log('  3. Node.js版本是否兼容', 'yellow');
        log('  4. 网络连接是否正常', 'yellow');
        log('  5. 尝试直接运行: npm run dev', 'yellow');
      }
    }, 30000); // 增加到30秒

    devServer.stdout.on('data', (data) => {
      const output = data.toString();

      // 记录所有输出用于诊断
      if (output.trim()) {
        log(`[DEBUG] ${output.trim()}`, 'cyan');
      }

      // 检测多种可能的输出格式
      if ((output.includes('Local:') || output.includes('localhost') || output.includes('ready') || output.includes('started')) && !serverStarted) {
        serverStarted = true;
        clearTimeout(startupTimeout);
        log('✅ 开发服务器启动成功', 'green');
        resolve(devServer);
      }
    });

    devServer.on('error', (err) => {
      log(`❌ 启动服务器时出错: ${err.message}`, 'red');
      clearTimeout(startupTimeout);
      reject(err);
    });

    // 处理退出信号
    process.on('SIGINT', () => {
      log('\n🛑 正在关闭服务器...', 'yellow');
      devServer.kill();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      devServer.kill();
      process.exit(0);
    });
  });
}

// 自动打开浏览器
let browserOpened = false;

function openBrowser () {
  if (browserOpened) {
    log('⚠️ 浏览器已打开，跳过重复打开', 'yellow');
    return;
  }

  const url = 'http://127.0.0.1:5173/';
  const platform = process.platform;

  log(`🌐 正在打开浏览器: ${url}`, 'cyan');

  let command;
  switch (platform) {
    case 'darwin': // macOS
      command = `open ${url}`;
      break;
    case 'win32': // Windows
      command = `start ${url}`;
      break;
    default: // Linux
      command = `xdg-open ${url}`;
      break;
  }

  // 等待3秒确保服务器完全启动
  setTimeout(() => {
    exec(command, (error) => {
      if (error) {
        log(`⚠️  无法自动打开浏览器，请手动访问: ${url}`, 'yellow');
        log('💡 提示: 如果服务器未启动，请等待几秒后再试', 'yellow');
      } else {
        browserOpened = true;
        log('✅ 浏览器已打开', 'green');
      }
    });
  }, 3000); // 延迟3秒等待服务器完全启动
}

// 主启动流程
async function main () {
  console.log('\n' + '='.repeat(50));
  log('  智能日历助手 - 一键启动器', 'bright');
  log('  Smart Calendar Launcher', 'bright');
  console.log('='.repeat(50) + '\n');

  try {
    // 检查Node.js版本
    if (!checkNodeVersion()) {
      process.exit(1);
    }

    // 检查并安装依赖
    if (!checkDependencies()) {
      await installDependencies();
    } else {
      log('✅ 依赖已安装', 'green');
    }

    // 启动开发服务器
    await startDevServer();

    // 打开浏览器
    openBrowser();

    // 显示使用说明
    console.log('\n' + '-'.repeat(50));
    // 显示使用说明
    log('📝 使用说明:', 'cyan');
    log('   • 应用地址: http://127.0.0.1:5173/', 'reset');
    log('   • 按 Ctrl+C 可停止服务器', 'reset');
    log('   • 关闭此窗口将停止服务器', 'reset');
    log('', 'reset'); console.log('-'.repeat(50) + '\n');
  } catch (error) {
    log(`\n❌ 启动失败: ${error.message}`, 'red');
    log('\n💡 故障排除:', 'yellow');
    log('   1. 确保已安装Node.js 16.0.0或更高版本', 'reset');
    log('   2. 检查网络连接是否正常', 'reset');
    log('   3. 确保端口5173未被占用', 'reset');
    log('   4. 尝试删除node_modules文件夹后重新启动', 'reset');
    log('   5. 查看详细错误日志', 'reset');
    process.exit(1);
  }
}

// 执行主函数
main();
