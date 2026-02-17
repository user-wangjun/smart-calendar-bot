/**
 * 错误处理中间件
 * 统一处理应用中的错误
 */

const winston = require('winston');

// 创建日志记录器
const logger = winston.createLogger({
  level: process.env.MCP_LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' })
  ]
});

const errorHandler = (logger) => {
  return (err, req, res, next) => {
    // 记录错误日志
    logger.error('错误发生', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    // 数据库验证错误
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: Object.values(err.errors).map(e => e.message)
      });
    }

    // JWT认证错误
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '令牌无效或已过期'
      });
    }

    // 数据库连接错误
    if (err.name === 'MongoError') {
      return res.status(500).json({
        success: false,
        message: '数据库操作失败',
        error: err.message
      });
    }

    // 权限错误
    if (err.status === 403) {
      return res.status(403).json({
        success: false,
        message: err.message || '权限不足'
      });
    }

    // 资源未找到错误
    if (err.status === 404) {
      return res.status(404).json({
        success: false,
        message: err.message || '请求的资源不存在'
      });
    }

    // 默认错误处理
    const statusCode = err.statusCode || 500;
    const message = err.message || '服务器内部错误';

    res.status(statusCode).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  };
};

module.exports = errorHandler;
