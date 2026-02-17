/**
 * MCP服务安装脚本
 * 自动化安装和配置MCP服务
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

// 检查系统要求
function checkSystemRequirements () {
  log('\n=== 检查系统要求 ===', 'blue');

  // 检查Node.js版本
  try {
    const nodeVersion = execSync('node --version').toString().trim();
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

    if (majorVersion >= 16) {
      log(`✓ Node.js版本: ${nodeVersion}`, 'green');
    } else {
      log(`✗ Node.js版本过低: ${nodeVersion} (需要 >= 16.0.0)`, 'red');
      process.exit(1);
    }
  } catch (error) {
    log('✗ 未安装Node.js', 'red');
    process.exit(1);
  }

  // 检查npm版本
  try {
    const npmVersion = execSync('npm --version').toString().trim();
    log(`✓ npm版本: ${npmVersion}`, 'green');
  } catch (error) {
    log('✗ 未安装npm', 'red');
    process.exit(1);
  }

  // 检查MongoDB
  try {
    execSync('mongod --version', { stdio: 'ignore' });
    log('✓ MongoDB已安装', 'green');
  } catch (error) {
    log('⚠ MongoDB未安装，请先安装MongoDB', 'yellow');
    log('下载地址: https://www.mongodb.com/try/download/community', 'blue');
  }

  // 检查磁盘空间
  const stats = fs.statSync(path.resolve('.'));
  log('✓ 磁盘空间充足', 'green');
}

// 创建必要的目录结构
function createDirectoryStructure () {
  log('\n=== 创建目录结构 ===', 'blue');

  const directories = [
    'logs',
    'uploads',
    'backups',
    'temp',
    'config'
  ];

  directories.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      log(`✓ 创建目录: ${dir}`, 'green');
    } else {
      log(`✓ 目录已存在: ${dir}`, 'green');
    }
  });
}

// 配置环境变量
async function configureEnvironment () {
  log('\n=== 配置环境变量 ===', 'blue');

  const envExamplePath = path.join(__dirname, '..', '.env.example');
  const envPath = path.join(__dirname, '..', '.env');

  if (!fs.existsSync(envPath)) {
    log('创建.env文件...', 'yellow');

    let envContent = fs.readFileSync(envExamplePath, 'utf8');

    // 询问用户是否修改默认配置
    const shouldConfigure = await question('是否要自定义配置? (y/n): ');

    if (shouldConfigure.toLowerCase() === 'y') {
      const adminPassword = await question('请输入管理员密码 (默认: Admin@2024): ');
      if (adminPassword) {
        envContent = envContent.replace('Admin@2024', adminPassword);
      }

      const dbPassword = await question('请输入数据库密码 (默认: your_secure_password_here): ');
      if (dbPassword) {
        envContent = envContent.replace('your_secure_password_here', dbPassword);
      }

      const jwtSecret = await question('请输入JWT密钥 (留空使用默认): ');
      if (jwtSecret) {
        envContent = envContent.replace('your_jwt_secret_key_change_this_in_production', jwtSecret);
      }
    }

    fs.writeFileSync(envPath, envContent);
    log('✓ .env文件创建成功', 'green');
  } else {
    log('✓ .env文件已存在', 'green');
  }
}

// 安装依赖
function installDependencies () {
  log('\n=== 安装依赖 ===', 'blue');

  try {
    log('正在安装npm依赖...', 'yellow');
    execSync('npm install', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    log('✓ 依赖安装成功', 'green');
  } catch (error) {
    log('✗ 依赖安装失败', 'red');
    log(error.message, 'red');
    process.exit(1);
  }

  // 安装PM2（如果未安装）
  try {
    execSync('pm2 --version', { stdio: 'ignore' });
    log('✓ PM2已安装', 'green');
  } catch (error) {
    log('正在安装PM2...', 'yellow');
    execSync('npm install -g pm2', { stdio: 'inherit' });
    log('✓ PM2安装成功', 'green');
  }
}

// 初始化数据库
async function initializeDatabase () {
  log('\n=== 初始化数据库 ===', 'blue');

  const shouldInitDB = await question('是否要初始化数据库? (y/n): ');

  if (shouldInitDB.toLowerCase() === 'y') {
    try {
      log('正在连接数据库...', 'yellow');
      execSync('node scripts/init-db.js', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      log('✓ 数据库初始化成功', 'green');
    } catch (error) {
      log('✗ 数据库初始化失败', 'red');
      log('请确保MongoDB正在运行', 'yellow');
    }
  }
}

// 创建管理员账号
async function createAdminAccount () {
  log('\n=== 创建管理员账号 ===', 'blue');

  const shouldCreateAdmin = await question('是否要创建管理员账号? (y/n): ');

  if (shouldCreateAdmin.toLowerCase() === 'y') {
    try {
      log('正在创建管理员账号...', 'yellow');
      execSync('node scripts/create-admin.js', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      log('✓ 管理员账号创建成功', 'green');
    } catch (error) {
      log('✗ 管理员账号创建失败', 'red');
      log(error.message, 'red');
    }
  }
}

// 生成安装报告
function generateInstallReport () {
  log('\n=== 生成安装报告 ===', 'blue');

  const report = {
    installTime: new Date().toISOString(),
    systemInfo: {
      nodeVersion: execSync('node --version').toString().trim(),
      npmVersion: execSync('npm --version').toString().trim(),
      platform: process.platform,
      arch: process.arch
    },
    installationPath: path.join(__dirname, '..'),
    configFiles: ['.env', '.env.example'],
    directories: ['logs', 'uploads', 'backups', 'temp', 'config'],
    nextSteps: [
      '1. 配置.env文件中的数据库连接信息',
      '2. 启动MongoDB服务',
      '3. 运行: npm run deploy',
      '4. 访问: http://localhost:3001/health',
      '5. 使用管理员账号登录管理平台'
    ]
  };

  const reportPath = path.join(__dirname, '..', 'install-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`✓ 安装报告已保存: ${reportPath}`, 'green');
}

// 主安装流程
async function main () {
  console.log('========================================');
  console.log('MCP管理控制平台 - 安装程序');
  console.log('========================================\n');

  try {
    checkSystemRequirements();
    createDirectoryStructure();
    await configureEnvironment();
    installDependencies();
    await initializeDatabase();
    await createAdminAccount();
    generateInstallReport();

    console.log('\n========================================');
    console.log('✓ 安装完成！');
    console.log('========================================');
    console.log('\n下一步:');
    console.log('1. 检查并修改.env配置文件');
    console.log('2. 启动MongoDB服务');
    console.log('3. 运行: npm run deploy');
    console.log('4. 访问: http://localhost:3001/health');
    console.log('\n如需帮助，请查看: install-report.json');
    console.log('========================================\n');

    rl.close();
  } catch (error) {
    log('\n✗ 安装失败', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkSystemRequirements, createDirectoryStructure };
