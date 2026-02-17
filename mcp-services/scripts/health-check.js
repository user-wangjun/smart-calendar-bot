/**
 * 健康检查脚本
 * 定期检查MCP服务的健康状态
 */

const axios = require('axios');
const winston = require('winston');
const fs = require('fs');
const path = require('path');

// 创建日志记录器
const logger = winston.createLogger({
  level: process.env.MCP_LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/health-check.log' })
  ]
});

// 健康检查配置
const healthCheckConfig = {
  serviceUrl: process.env.MCP_SERVICE_URL || 'http://localhost:3001',
  healthEndpoint: '/health',
  checkInterval: parseInt(process.env.MCP_HEALTH_CHECK_INTERVAL) || 30000,
  timeout: parseInt(process.env.MCP_HEALTH_CHECK_TIMEOUT) || 10000,
  alertThreshold: 3, // 连续失败3次触发告警
  alertEmail: process.env.MCP_MONITOR_ALERT_EMAIL || 'alerts@mcp-platform.com'
};

// 健康检查状态
const healthCheckStatus = {
  consecutiveFailures: 0,
  lastCheckTime: null,
  lastCheckResult: null,
  isHealthy: true
};

// 执行健康检查
async function performHealthCheck () {
  const startTime = Date.now();

  try {
    logger.info('开始健康检查', {
      url: healthCheckConfig.serviceUrl + healthCheckConfig.healthEndpoint
    });

    const response = await axios.get(
      healthCheckConfig.serviceUrl + healthCheckConfig.healthEndpoint,
      { timeout: healthCheckConfig.timeout }
    );

    const responseTime = Date.now() - startTime;

    if (response.status === 200 && response.data.status === 'healthy') {
      healthCheckStatus.consecutiveFailures = 0;
      healthCheckStatus.isHealthy = true;
      healthCheckStatus.lastCheckResult = 'success';

      logger.info('健康检查通过', {
        responseTime,
        uptime: response.data.uptime,
        environment: response.data.environment
      });

      return {
        success: true,
        responseTime,
        data: response.data
      };
    } else {
      throw new Error(`健康状态异常: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    healthCheckStatus.consecutiveFailures++;
    healthCheckStatus.lastCheckResult = 'failure';

    logger.error('健康检查失败', {
      error: error.message,
      consecutiveFailures: healthCheckStatus.consecutiveFailures
    });

    // 检查是否需要发送告警
    if (healthCheckStatus.consecutiveFailures >= healthCheckConfig.alertThreshold) {
      healthCheckStatus.isHealthy = false;
      await sendAlert(error);
    }

    return {
      success: false,
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
}

// 发送告警邮件
async function sendAlert (error) {
  try {
    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
      host: process.env.MCP_EMAIL_HOST,
      port: parseInt(process.env.MCP_EMAIL_PORT) || 587,
      secure: process.env.MCP_EMAIL_SECURE === 'true',
      auth: {
        user: process.env.MCP_EMAIL_USER,
        pass: process.env.MCP_EMAIL_PASSWORD
      }
    });

    const mailOptions = {
      from: process.env.MCP_EMAIL_FROM || 'MCP Platform <noreply@mcp-platform.com>',
      to: healthCheckConfig.alertEmail,
      subject: 'MCP服务健康检查告警',
      html: `
        <h2>MCP服务健康检查告警</h2>
        <p><strong>告警时间:</strong> ${new Date().toLocaleString('zh-CN')}</p>
        <p><strong>服务地址:</strong> ${healthCheckConfig.serviceUrl}</p>
        <p><strong>连续失败次数:</strong> ${healthCheckStatus.consecutiveFailures}</p>
        <p><strong>错误信息:</strong> ${error.message}</p>
        <p><strong>建议操作:</strong></p>
        <ul>
          <li>检查服务是否正常运行</li>
          <li>查看服务日志: logs/mcp-service.log</li>
          <li>检查数据库连接状态</li>
          <li>检查系统资源使用情况</li>
          <li>必要时重启服务</li>
        </ul>
        <hr>
        <p><small>此邮件由MCP监控服务自动发送，请勿回复。</small></p>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info('告警邮件发送成功', {
      to: healthCheckConfig.alertEmail
    });
  } catch (error) {
    logger.error('告警邮件发送失败', {
      error: error.message
    });
  }
}

// 生成健康检查报告
function generateHealthReport (checks) {
  const totalChecks = checks.length;
  const successfulChecks = checks.filter(c => c.success).length;
  const failedChecks = checks.filter(c => !c.success).length;
  const avgResponseTime = checks.reduce((sum, c) => sum + c.responseTime, 0) / totalChecks;
  const maxResponseTime = Math.max(...checks.map(c => c.responseTime));
  const minResponseTime = Math.min(...checks.map(c => c.responseTime));

  const report = {
    reportTime: new Date().toISOString(),
    summary: {
      totalChecks,
      successfulChecks,
      failedChecks,
      successRate: ((successfulChecks / totalChecks) * 100).toFixed(2) + '%',
      avgResponseTime: avgResponseTime.toFixed(2) + 'ms',
      maxResponseTime: maxResponseTime + 'ms',
      minResponseTime: minResponseTime + 'ms'
    },
    details: checks.map((check, index) => ({
      checkNumber: index + 1,
      timestamp: new Date().toISOString(),
      success: check.success,
      responseTime: check.responseTime + 'ms',
      error: check.error || null,
      data: check.data || null
    })),
    healthStatus: {
      isHealthy: healthCheckStatus.isHealthy,
      consecutiveFailures: healthCheckStatus.consecutiveFailures,
      lastCheckResult: healthCheckStatus.lastCheckResult
    },
    recommendations: generateRecommendations(successfulChecks, failedChecks, avgResponseTime)
  };

  const reportPath = path.join(__dirname, '..', 'health-check-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  logger.info('健康检查报告已保存', { path: reportPath });

  return report;
}

// 生成改进建议
function generateRecommendations (successfulChecks, failedChecks, avgResponseTime) {
  const recommendations = [];

  if (failedChecks > successfulChecks) {
    recommendations.push({
      priority: 'high',
      category: 'stability',
      title: '服务稳定性问题',
      description: '失败检查次数超过成功检查次数',
      action: '建议检查服务日志，排查失败原因，必要时重启服务'
    });
  }

  if (avgResponseTime > 5000) {
    recommendations.push({
      priority: 'medium',
      category: 'performance',
      title: '响应时间过长',
      description: `平均响应时间${avgResponseTime.toFixed(2)}ms超过5秒`,
      action: '建议优化服务性能，检查数据库查询效率，考虑增加服务器资源'
    });
  }

  if (healthCheckStatus.consecutiveFailures > 5) {
    recommendations.push({
      priority: 'critical',
      category: 'availability',
      title: '服务可用性严重问题',
      description: `连续失败${healthCheckStatus.consecutiveFailures}次`,
      action: '立即检查服务状态，查看错误日志，必要时联系技术支持'
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'low',
      category: 'maintenance',
      title: '服务运行正常',
      description: '所有健康检查均通过',
      action: '继续监控，定期检查服务日志和性能指标'
    });
  }

  return recommendations;
}

// 主健康检查循环
async function startHealthCheck () {
  logger.info('启动健康检查服务', {
    checkInterval: healthCheckConfig.checkInterval + 'ms',
    serviceUrl: healthCheckConfig.serviceUrl
  });

  const checks = [];
  let checkCount = 0;

  // 执行健康检查
  const performCheck = async () => {
    try {
      const result = await performHealthCheck();
      checks.push({
        timestamp: new Date().toISOString(),
        ...result
      });

      checkCount++;

      // 每100次检查生成一次报告
      if (checkCount % 100 === 0) {
        generateHealthReport(checks);
      }
    } catch (error) {
      logger.error('健康检查执行失败', { error: error.message });
    }
  };

  // 立即执行第一次检查
  await performCheck();

  // 设置定时检查
  setInterval(performCheck, healthCheckConfig.checkInterval);

  logger.info('健康检查服务已启动', {
    interval: healthCheckConfig.checkInterval + 'ms'
  });
}

// 命令行执行
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--once')) {
    // 执行单次检查
    console.log('执行单次健康检查...');
    performHealthCheck().then(result => {
      console.log('健康检查结果:', JSON.stringify(result, null, 2));
      process.exit(0);
    }).catch(error => {
      console.error('健康检查失败:', error.message);
      process.exit(1);
    });
  } else if (args.includes('--report')) {
    // 生成报告
    console.log('生成健康检查报告...');
    // 这里应该从数据库或文件中读取历史检查数据
    console.log('报告生成功能需要先运行健康检查服务');
    process.exit(0);
  } else {
    // 启动持续健康检查
    console.log('启动持续健康检查服务...');
    console.log('按 Ctrl+C 停止服务');
    startHealthCheck();
  }
}

module.exports = { performHealthCheck, generateHealthReport };
