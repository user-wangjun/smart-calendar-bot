/**
 * 请求日志中间件
 * 记录所有API请求的详细信息
 */

const winston = require('winston');
const { OperationLog } = require('../models/models');

const requestLogger = (logger) => {
  return async (req, res, next) => {
    const startTime = Date.now();

    // 记录原始res.json方法
    const originalJson = res.json;
    res.json = async function (data) {
      const responseTime = Date.now() - startTime;

      // 记录请求日志
      const logData = {
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.method !== 'GET' ? req.body : undefined,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        responseTime,
        statusCode: res.statusCode,
        success: data.success !== false
      };

      logger.info('API请求', logData);

      // 记录操作日志（仅对需要认证的操作）
      if (req.user && req.path.startsWith('/api/')) {
        try {
          await OperationLog.create({
            userId: req.user.id,
            action: determineAction(req.method, req.path),
            resource: determineResource(req.path),
            resourceId: determineResourceId(req),
            details: {
              method: req.method,
              path: req.path,
              responseTime,
              statusCode: res.statusCode
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            status: data.success !== false ? 'success' : 'failure',
            errorMessage: data.success === false ? data.message : undefined
          });
        } catch (error) {
          logger.error('操作日志记录失败', { error: error.message });
        }
      }

      // 调用原始res.json
      originalJson.call(res, data);
    };

    next();
  };
};

// 确定操作类型
function determineAction (method, path) {
  if (method === 'POST') return 'create';
  if (method === 'PUT') return 'update';
  if (method === 'DELETE') return 'delete';
  if (path.includes('/start')) return 'start';
  if (path.includes('/stop')) return 'stop';
  if (path.includes('/restart')) return 'restart';
  if (path.includes('/health-check')) return 'health_check';
  return 'read';
}

// 确定资源类型
function determineResource (path) {
  if (path.includes('/users')) return 'user';
  if (path.includes('/services')) return 'service';
  if (path.includes('/config')) return 'config';
  if (path.includes('/logs')) return 'monitor_log';
  if (path.includes('/auth')) return 'auth';
  return 'system';
}

// 确定资源ID
function determineResourceId (req) {
  if (req.params.id) return req.params.id;
  if (req.params.key) return req.params.key;
  return undefined;
}

module.exports = requestLogger;
