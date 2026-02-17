/**
 * MongoDB 自动化检测脚本
 * 用于检测MongoDB安装状态、服务运行状态及配置情况
 * 支持 Windows / macOS / Linux
 */

const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');
const net = require('net');
const os = require('os');

// 配置
const CONFIG = {
  defaultPort: 27017,
  host: '127.0.0.1',
  serviceName: process.platform === 'win32' ? 'MongoDB' : 'mongod',
  reportFile: 'mongodb-check-report.json'
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log (msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

// 检测报告数据结构
const report = {
  timestamp: new Date().toISOString(),
  os: {
    platform: process.platform,
    release: os.release(),
    type: os.type()
  },
  installation: {
    installed: false,
    version: null,
    path: null
  },
  service: {
    running: false,
    status: null,
    pid: null
  },
  network: {
    listening: false,
    port: CONFIG.defaultPort,
    host: CONFIG.host
  },
  environment: {
    inPath: false,
    pathValue: null
  },
  recommendations: []
};

/**
 * 执行命令并返回结果，忽略错误
 */
function runCommand (command) {
  try {
    return execSync(command, { stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8' }).trim();
  } catch (error) {
    return null;
  }
}

/**
 * 1. 检测安装状态
 */
function checkInstallation () {
  log('\n[1/5] 检测MongoDB安装状态...', 'blue');

  const versionOutput = runCommand('mongod --version');

  if (versionOutput) {
    report.installation.installed = true;
    const versionMatch = versionOutput.match(/db version v(\d+\.\d+\.\d+)/);
    report.installation.version = versionMatch ? versionMatch[1] : 'Unknown';

    // 尝试获取可执行文件路径
    const whereCmd = process.platform === 'win32' ? 'where mongod' : 'which mongod';
    report.installation.path = runCommand(whereCmd);

    log(`✓ 已安装 MongoDB v${report.installation.version}`, 'green');
    if (report.installation.path) log(`  路径: ${report.installation.path}`, 'reset');
  } else {
    log('✗ 未检测到 MongoDB 安装', 'red');
    report.recommendations.push({
      priority: 'High',
      issue: 'MongoDB未安装',
      action: '请访问官方网站下载并安装 MongoDB Community Server',
      link: 'https://www.mongodb.com/try/download/community'
    });
  }
}

/**
 * 2. 检测服务状态
 */
function checkService () {
  log('\n[2/5] 检测服务运行状态...', 'blue');

  if (process.platform === 'win32') {
    const serviceStatus = runCommand(`sc query "${CONFIG.serviceName}"`);
    if (serviceStatus && serviceStatus.includes('RUNNING')) {
      report.service.running = true;
      report.service.status = 'Running';
      log('✓ MongoDB 服务正在运行', 'green');
    } else if (serviceStatus) {
      report.service.status = 'Stopped';
      log('⚠ MongoDB 服务已安装但未运行', 'yellow');
      report.recommendations.push({
        priority: 'High',
        issue: '服务未启动',
        action: `请在管理员终端运行: net start ${CONFIG.serviceName}`
      });
    } else {
      report.service.status = 'Not Found';
      log('✗ 未找到 MongoDB 服务', 'red');
    }
  } else {
    // Linux/macOS
    const status = runCommand(`systemctl status ${CONFIG.serviceName}`) || runCommand(`service ${CONFIG.serviceName} status`);
    if (status && status.includes('active (running)')) {
      report.service.running = true;
      report.service.status = 'Running';
      log('✓ MongoDB 服务正在运行', 'green');
    } else {
      // 检查进程
      const ps = runCommand('ps aux | grep mongod | grep -v grep');
      if (ps) {
        report.service.running = true;
        report.service.status = 'Running (Process)';
        log('✓ MongoDB 进程正在运行', 'green');
      } else {
        report.service.status = 'Stopped';
        log('✗ MongoDB 服务未运行', 'red');
        report.recommendations.push({
          priority: 'High',
          issue: '服务未启动',
          action: `请运行: sudo systemctl start ${CONFIG.serviceName}`
        });
      }
    }
  }
}

/**
 * 3. 检测网络端口
 */
function checkPort () {
  log('\n[3/5] 检测端口监听状态...', 'blue');

  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = 2000;

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      report.network.listening = true;
      log(`✓ 端口 ${CONFIG.defaultPort} 可连接`, 'green');
      socket.destroy();
      resolve();
    });

    socket.on('timeout', () => {
      report.network.listening = false;
      log(`✗ 端口 ${CONFIG.defaultPort} 连接超时`, 'red');
      socket.destroy();
      resolve();
    });

    socket.on('error', (err) => {
      report.network.listening = false;
      log(`✗ 端口 ${CONFIG.defaultPort} 连接失败: ${err.message}`, 'red');
      if (err.code === 'ECONNREFUSED') {
        if (!report.recommendations.find(r => r.issue === '服务未启动')) {
          report.recommendations.push({
            priority: 'High',
            issue: '端口无法连接',
            action: '服务可能未启动或配置了非默认端口，请检查配置文件'
          });
        }
      }
      resolve();
    });

    socket.connect(CONFIG.defaultPort, CONFIG.host);
  });
}

/**
 * 4. 检测环境变量
 */
function checkEnvironment () {
  log('\n[4/5] 检测环境变量...', 'blue');

  const pathEnv = process.env.PATH || '';
  const paths = pathEnv.split(path.delimiter);

  // 简单检查路径中是否包含 mongo 关键字
  const mongoPath = paths.find(p => p.toLowerCase().includes('mongo') || p.toLowerCase().includes('server'));

  if (report.installation.path) {
    report.environment.inPath = true;
    log('✓ MongoDB 在 PATH 环境变量中', 'green');
  } else if (mongoPath) {
    report.environment.inPath = true;
    log('✓ PATH 中包含疑似 MongoDB 路径', 'green');
  } else {
    log('⚠ PATH 中未找到 MongoDB 路径', 'yellow');
    report.recommendations.push({
      priority: 'Low',
      issue: '环境变量缺失',
      action: '建议将 MongoDB bin 目录添加到系统 PATH 环境变量中以便直接使用命令'
    });
  }

  report.environment.pathValue = mongoPath || 'Not found';
}

/**
 * 5. 生成报告
 */
function generateReport () {
  log('\n[5/5] 生成检测报告...', 'blue');

  const reportPath = path.join(process.cwd(), CONFIG.reportFile);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  log('========================================', 'cyan');
  log(`检测完成！报告已保存至: ${reportPath}`, 'cyan');
  log('========================================', 'cyan');

  // 输出摘要
  console.log('\n检测摘要:');
  console.log(`- 操作系统: ${report.os.platform} ${report.os.release}`);
  console.log(`- 安装状态: ${report.installation.installed ? '已安装 v' + report.installation.version : '未安装'}`);
  console.log(`- 服务状态: ${report.service.status || 'Unknown'}`);
  console.log(`- 端口连通: ${report.network.listening ? 'Yes' : 'No'}`);

  if (report.recommendations.length > 0) {
    console.log('\n建议行动:');
    report.recommendations.forEach((rec, idx) => {
      console.log(`${idx + 1}. [${rec.priority}] ${rec.action}`);
      if (rec.link) console.log(`   链接: ${rec.link}`);
    });
  }
  log('========================================', 'cyan');
}

// 主函数
async function main () {
  log('开始 MongoDB 全面检测...\n', 'cyan');

  checkInstallation();
  checkService();
  await checkPort();
  checkEnvironment();
  generateReport();
}

// 运行
main().catch(err => {
  console.error('检测脚本执行出错:', err);
});
