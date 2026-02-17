/**
 * MCP服务部署脚本
 * 自动化部署和启动MCP服务
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// 创建readline接口用于用户输入
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log (message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function question (query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// 检查环境准备
async function checkEnvironment () {
  log('\n=== 检查部署环境 ===', 'blue');

  // 检查.env文件
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    log('✗ .env文件不存在，请先运行安装程序', 'red');
    process.exit(1);
  }
  log('✓ .env配置文件存在', 'green');

  // 检查MongoDB连接
  try {
    execSync('mongod --version', { stdio: 'ignore' });
    log('✓ MongoDB已安装', 'green');
  } catch (error) {
    log('✗ MongoDB未安装', 'red');
    log('请先安装MongoDB: https://www.mongodb.com/try/download/community', 'yellow');
    process.exit(1);
  }

  // 检查端口占用
  try {
    const port = process.env.MCP_SERVER_PORT || 3001;
    execSync(`netstat -ano | findstr :${port}`, { stdio: 'ignore' });
    log(`⚠ 端口${port}已被占用`, 'yellow');
    const shouldContinue = await question('是否继续部署? (y/n): ');
    if (shouldContinue.toLowerCase() !== 'y') {
      process.exit(0);
    }
  } catch (error) {
    log('✓ 端口可用', 'green');
  }
}

// 备份现有数据
function backupExistingData () {
  log('\n=== 备份现有数据 ===', 'blue');

  const backupDir = path.join(__dirname, '..', 'backups');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `pre-deploy-${timestamp}`);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  try {
    fs.mkdirSync(backupPath, { recursive: true });

    // 备份配置文件
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      fs.copyFileSync(envPath, path.join(backupPath, '.env'));
      log('✓ 备份配置文件', 'green');
    }

    // 备份上传文件
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const backupUploads = path.join(backupPath, 'uploads');
      fs.mkdirSync(backupUploads, { recursive: true });
      copyDirectory(uploadsDir, backupUploads);
      log('✓ 备份上传文件', 'green');
    }

    log(`✓ 备份完成: ${backupPath}`, 'green');
  } catch (error) {
    log('✗ 备份失败', 'red');
    log(error.message, 'red');
  }
}

// 复制目录
function copyDirectory (src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 安装依赖
function installDependencies () {
  log('\n=== 安装依赖 ===', 'blue');

  try {
    log('正在安装npm依赖...', 'yellow');
    execSync('npm install --production', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    log('✓ 依赖安装成功', 'green');
  } catch (error) {
    log('✗ 依赖安装失败', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

// 构建项目
function buildProject () {
  log('\n=== 构建项目 ===', 'blue');

  try {
    log('正在构建项目...', 'yellow');
    execSync('npm run build', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    log('✓ 项目构建成功', 'green');
  } catch (error) {
    log('⚠ 项目构建失败，将使用开发模式', 'yellow');
  }
}

// 启动MongoDB
function startMongoDB () {
  log('\n=== 启动MongoDB ===', 'blue');

  try {
    // 检查MongoDB是否已运行
    execSync('mongod --version', { stdio: 'ignore' });
    log('✓ MongoDB已安装', 'green');

    // 尝试连接MongoDB
    try {
      execSync('mongo --eval "db.version()"', { stdio: 'ignore' });
      log('✓ MongoDB正在运行', 'green');
    } catch (error) {
      log('⚠ MongoDB未运行，尝试启动...', 'yellow');
      log('请手动启动MongoDB服务', 'yellow');
      log('Windows: net start MongoDB');
      log('Linux/Mac: sudo systemctl start mongod');
    }
  } catch (error) {
    log('✗ MongoDB检查失败', 'red');
  }
}

// 使用PM2启动服务
function startServiceWithPM2 () {
  log('\n=== 使用PM2启动服务 ===', 'blue');

  try {
    // 检查PM2是否已安装
    execSync('pm2 --version', { stdio: 'ignore' });
    log('✓ PM2已安装', 'green');

    // 停止旧实例
    try {
      execSync('pm2 stop mcp-platform', { stdio: 'ignore' });
      log('✓ 停止旧实例', 'green');
    } catch (error) {
      log('✓ 无旧实例运行', 'green');
    }

    // 启动新实例
    const instances = process.env.MCP_PM2_INSTANCES || 2;
    log(`正在启动${instances}个实例...`, 'yellow');

    execSync(`pm2 start src/index.js --name mcp-platform --instances ${instances}`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });

    log('✓ 服务启动成功', 'green');

    // 设置PM2开机自启
    try {
      execSync('pm2 startup', { stdio: 'inherit' });
      log('✓ PM2开机自启已配置', 'green');
    } catch (error) {
      log('⚠ PM2开机自启配置失败', 'yellow');
    }

    // 保存PM2配置
    execSync('pm2 save', { stdio: 'ignore' });
    log('✓ PM2配置已保存', 'green');
  } catch (error) {
    log('✗ PM2启动失败', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

// 验证服务状态
function verifyServiceStatus () {
  log('\n=== 验证服务状态 ===', 'blue');

  const maxRetries = 10;
  const retryInterval = 3000; // 3秒

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = execSync('curl -s http://localhost:3001/health', {
        stdio: 'pipe',
        timeout: 5000
      });

      const healthData = JSON.parse(response.toString());

      if (healthData.status === 'healthy') {
        log('✓ 服务健康检查通过', 'green');
        log(`✓ 服务版本: ${healthData.version}`, 'green');
        log(`✓ 运行时间: ${healthData.uptime}秒`, 'green');
        log(`✓ 环境: ${healthData.environment}`, 'green');
        return true;
      }
    } catch (error) {
      log(`⏳ 等待服务启动... (${i + 1}/${maxRetries})`, 'yellow');
    }

    if (i < maxRetries - 1) {
      // 等待后重试
      // 等待重试间隔
      const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
      wait(retryInterval);
    }
  }

  log('✗ 服务启动超时', 'red');
  log('请检查日志: logs/mcp-service.log', 'yellow');
  return false;
}

// 生成部署报告
function generateDeployReport () {
  log('\n=== 生成部署报告 ===', 'blue');

  const report = {
    deployTime: new Date().toISOString(),
    serviceInfo: {
      name: 'MCP管理控制平台',
      version: require('../package.json').version,
      host: process.env.MCP_SERVER_HOST || '0.0.0.0',
      port: process.env.MCP_SERVER_PORT || 3001,
      environment: process.env.MCP_SERVER_ENV || 'production'
    },
    accessInfo: {
      serviceUrl: `http://${process.env.MCP_SERVER_HOST || 'localhost'}:${process.env.MCP_SERVER_PORT || 3001}`,
      healthCheckUrl: `http://${process.env.MCP_SERVER_HOST || 'localhost'}:${process.env.MCP_SERVER_PORT || 3001}/health`,
      apiDocsUrl: `http://${process.env.MCP_SERVER_HOST || 'localhost'}:${process.env.MCP_SERVER_PORT || 3001}/api/docs`,
      adminUsername: process.env.MCP_ADMIN_USERNAME || 'admin',
      adminEmail: process.env.MCP_ADMIN_EMAIL || 'admin@mcp-platform.com'
    },
    databaseInfo: {
      host: process.env.MCP_DB_HOST || 'localhost',
      port: process.env.MCP_DB_PORT || 27017,
      name: process.env.MCP_DB_NAME || 'mcp_management_db'
    },
    pm2Info: {
      instances: process.env.MCP_PM2_INSTANCES || 2,
      maxMemoryRestart: process.env.MCP_PM2_MAX_MEMORY_RESTART || '1G',
      minUptime: process.env.MCP_PM2_MIN_UPTIME || '10s'
    },
    monitoringInfo: {
      healthCheckInterval: `${process.env.MCP_HEALTH_CHECK_INTERVAL || 30000}ms`,
      alertEmail: process.env.MCP_MONITOR_ALERT_EMAIL || 'alerts@mcp-platform.com'
    },
    nextSteps: [
      '1. 访问服务健康检查: http://localhost:3001/health',
      '2. 使用管理员账号登录管理平台',
      '3. 配置服务监控和告警',
      '4. 查看服务日志: logs/mcp-service.log',
      '5. 使用PM2管理服务: pm2 list, pm2 logs mcp-platform'
    ],
    troubleshooting: {
      serviceNotStarting: '检查MongoDB是否运行，查看日志文件',
      portInUse: '修改.env中的端口配置或停止占用端口的进程',
      databaseConnectionFailed: '检查数据库连接信息，确保MongoDB服务正常',
      permissionDenied: '检查文件和目录权限，确保服务有读写权限'
    }
  };

  const reportPath = path.join(__dirname, '..', 'deploy-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`✓ 部署报告已保存: ${reportPath}`, 'green');

  return report;
}

// 主部署流程
async function main () {
  console.log('========================================');
  console.log('MCP管理控制平台 - 部署程序');
  console.log('========================================\n');

  try {
    checkEnvironment();
    backupExistingData();
    installDependencies();
    buildProject();
    startMongoDB();
    startServiceWithPM2();
    const isHealthy = verifyServiceStatus();
    const report = generateDeployReport();

    if (isHealthy) {
      console.log('\n========================================');
      console.log('✓ 部署完成！');
      console.log('========================================');
      console.log('\n服务访问信息:');
      console.log(`服务地址: ${report.accessInfo.serviceUrl}`);
      console.log(`健康检查: ${report.accessInfo.healthCheckUrl}`);
      console.log(`API文档: ${report.accessInfo.apiDocsUrl}`);
      console.log(`管理员账号: ${report.accessInfo.adminUsername}`);
      console.log(`管理员邮箱: ${report.accessInfo.adminEmail}`);
      console.log('\n下一步操作:');
      report.nextSteps.forEach((step, index) => {
        console.log(step);
      });
      console.log('\n如需帮助，请查看: deploy-report.json');
      console.log('========================================\n');
    } else {
      console.log('\n========================================');
      console.log('⚠ 部署完成，但服务未正常启动');
      console.log('========================================');
      console.log('\n请检查:');
      console.log('1. MongoDB服务是否正常运行');
      console.log('2. 查看服务日志: logs/mcp-service.log');
      console.log('3. 检查端口占用情况');
      console.log('4. 查看PM2进程状态: pm2 list');
      console.log('========================================\n');
    }

    rl.close();
  } catch (error) {
    log('\n✗ 部署失败', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkEnvironment, startServiceWithPM2, verifyServiceStatus };
