/**
 * 部署验证脚本
 * 用于自动化检查部署后的站点健康状况
 *
 * 用法: node scripts/verify-deployment.js <url>
 * 示例: node scripts/verify-deployment.js https://smart-calendar.vercel.app
 */

import https from 'https';
import { URL } from 'url';

const targetUrl = process.argv[2];

if (!targetUrl) {
  console.error('❌ 请提供目标 URL');
  console.log('用法: node scripts/verify-deployment.js <url>');
  process.exit(1);
}

console.log(`🔍 开始验证部署目标: ${targetUrl}\n`);

const checks = [
  { name: '首页访问 (Root)', path: '/' },
  { name: 'SPA 路由 (Calendar)', path: '/calendar' }, // 验证 rewrite 是否生效
  { name: '静态资源 (Manifest)', path: '/manifest.json' } // 验证静态文件
  // { name: 'API 健康检查', path: '/api/health' } // 如果有 API 路由可启用
];

let hasErrors = false;

async function checkPath (check) {
  return new Promise((resolve) => {
    const fullUrl = new URL(check.path, targetUrl).toString();
    const startTime = Date.now();

    const req = https.get(fullUrl, (res) => {
      const duration = Date.now() - startTime;
      const isSuccess = res.statusCode >= 200 && res.statusCode < 400;

      // 对于 SPA 路由，如果返回 index.html (通常 200 OK)，说明 rewrite 成功
      // 如果返回 404，说明 vercel.json 配置失败

      const statusIcon = isSuccess ? '✅' : '❌';
      console.log(`${statusIcon} [${res.statusCode}] ${check.name.padEnd(20)} - ${duration}ms`);

      if (!isSuccess) {
        console.error(`   -> URL: ${fullUrl}`);
        hasErrors = true;
      }

      // 消耗响应流
      res.resume();
      resolve();
    });

    req.on('error', (e) => {
      console.log(`❌ [ERR] ${check.name.padEnd(20)} - ${e.message}`);
      hasErrors = true;
      resolve();
    });
  });
}

async function runChecks () {
  for (const check of checks) {
    await checkPath(check);
  }

  console.log('\n----------------------------------------');
  if (hasErrors) {
    console.log('🔴 验证失败: 发现潜在问题，请检查日志。');
    process.exit(1);
  } else {
    console.log('🟢 验证通过: 基础功能看似正常。');
    console.log('   (请继续进行手动功能回归测试)');
    process.exit(0);
  }
}

runChecks();
