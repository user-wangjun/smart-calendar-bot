/**
 * 资源检查与修复脚本
 * 用途：检查环境变量、配置文件，并提供修复建议或自动修复
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log (color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkAndCopyEnv (directory, exampleFile = '.env.example', targetFile = '.env') {
  const examplePath = path.join(directory, exampleFile);
  const targetPath = path.join(directory, targetFile);

  log(colors.cyan, `\n检查环境变量文件: ${path.relative(rootDir, targetPath)}`);

  if (!fs.existsSync(examplePath)) {
    log(colors.red, `  ❌ 找不到示例文件: ${exampleFile}`);
    return;
  }

  if (!fs.existsSync(targetPath)) {
    log(colors.yellow, `  ⚠️  ${targetFile} 不存在，正在从 ${exampleFile} 创建...`);
    try {
      fs.copyFileSync(examplePath, targetPath);
      log(colors.green, `  ✅ 已创建 ${targetFile}`);
    } catch (error) {
      log(colors.red, `  ❌ 创建失败: ${error.message}`);
    }
  } else {
    log(colors.green, `  ✅ ${targetFile} 已存在`);
  }

  // 检查空值
  const content = fs.readFileSync(targetPath, 'utf8');
  const lines = content.split('\n');
  let missingValues = 0;

  lines.forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const parts = line.split('=');
      if (parts.length === 2 && (!parts[1] || parts[1].trim() === '')) {
        log(colors.yellow, `    ⚠️  变量未设置: ${parts[0]}`);
        missingValues++;
      }
    }
  });

  if (missingValues > 0) {
    log(colors.yellow, `  需要关注: 发现 ${missingValues} 个未设置的环境变量`);
  }
}

function checkDockerRuntime () {
  log(colors.cyan, '\n检查 Docker 运行时...');
  try {
    execSync('docker --version', { stdio: 'ignore' });
    log(colors.green, '  ✅ Docker 已安装');

    try {
      execSync('docker compose version', { stdio: 'ignore' });
      log(colors.green, '  ✅ Docker Compose (v2) 已可用');
    } catch (e) {
      log(colors.yellow, '  ⚠️  Docker Compose 未检测到 (可能需要单独安装或版本过旧)');
    }
  } catch (e) {
    log(colors.red, '  ❌ 严重: Docker 未安装或未添加到 PATH');
    log(colors.red, '     请访问 https://www.docker.com/products/docker-desktop/ 下载安装');
  }
}

function checkDockerFiles () {
  log(colors.cyan, '\n检查容器化配置...');

  const files = [
    'Dockerfile',
    'docker-compose.yml',
    '.dockerignore',
    'mcp-services/Dockerfile'
  ];

  files.forEach(file => {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
      log(colors.green, `  ✅ 已存在: ${file}`);
    } else {
      // .dockerignore 可以复用 .gitignore
      if (file === '.dockerignore' && fs.existsSync(path.join(rootDir, '.gitignore'))) {
        log(colors.yellow, `  ⚠️  缺失: ${file} (建议创建，可复制 .gitignore)`);
      } else {
        log(colors.red, `  ❌ 缺失: ${file}`);
      }
    }
  });
}

function main () {
  log(colors.cyan, '========================================');
  log(colors.cyan, '      智能日历助手 - 资源完整性检查      ');
  log(colors.cyan, '========================================');

  // 0. 检查 Docker 运行时
  checkDockerRuntime();

  // 1. 检查根目录 .env
  checkAndCopyEnv(rootDir);

  // 2. 检查 mcp-services .env
  checkAndCopyEnv(path.join(rootDir, 'mcp-services'));

  // 3. 检查 Docker 配置
  checkDockerFiles();

  log(colors.cyan, '\n========================================');
  log(colors.green, '检查完成。请根据提示补充缺失的配置项。');
  log(colors.cyan, '========================================');
}

main();
