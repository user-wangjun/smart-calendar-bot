/**
 * MCP（Management and Control Platform）服务主入口文件
 * 提供管理和控制平台的核心功能
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const path = require('path');

// 导入路由
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const serviceRoutes = require('./routes/services');
const monitorRoutes = require('./routes/monitor');
const configRoutes = require('./routes/config');
const uploadRoutes = require('./routes/upload');

// 导入中间件
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const { authMiddleware } = require('./middleware/auth');

// 导入配置
const config = require('./config/config');

// 初始化日志系统
const logger = winston.createLogger({
  level: process.env.MCP_LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'mcp-platform' },
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error'
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log')
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// 创建Express应用
const app = express();

// 安全中间件
if (process.env.MCP_HELMET_ENABLED !== 'false') {
  app.use(helmet());
}

// CORS配置
if (process.env.MCP_CORS_ENABLED !== 'false') {
  app.use(cors({
    origin: process.env.MCP_CORS_ORIGIN || '*',
    credentials: true
  }));
}

// 压缩响应
app.use(compression());

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志中间件
app.use(requestLogger(logger));

// API限流配置
if (process.env.MCP_RATE_LIMIT_ENABLED !== 'false') {
  const limiter = rateLimit({
    windowMs: (process.env.MCP_RATE_LIMIT_WINDOW || 15) * 60 * 1000,
    max: process.env.MCP_RATE_LIMIT_MAX || 100,
    message: '请求过于频繁，请稍后再试',
    standardHeaders: true,
    legacyHeaders: false,
    skipFailedRequests: process.env.MCP_RATE_LIMIT_SKIP_FAILED_REQUESTS === 'true'
  });

  app.use('/api/', limiter);
}

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: require('../package.json').version
  });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/services', authMiddleware, serviceRoutes);
app.use('/api/monitor', authMiddleware, monitorRoutes);
app.use('/api/config', authMiddleware, configRoutes);
app.use('/api/uploads', uploadRoutes); // 公开上传接口或根据需求添加 authMiddleware

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在',
    path: req.path
  });
});

// 错误处理中间件
app.use(errorHandler(logger));

// 数据库连接
const connectDB = async (retries = 5, interval = 5000) => {
  const dbUri = `mongodb://${process.env.MCP_DB_USERNAME}:${process.env.MCP_DB_PASSWORD}@${process.env.MCP_DB_HOST}:${process.env.MCP_DB_PORT}/${process.env.MCP_DB_NAME}`;

  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: parseInt(process.env.MCP_DB_TIMEOUT) || 30000,
    maxPoolSize: parseInt(process.env.MCP_DB_POOL_SIZE) || 10
  };

  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(dbUri, options);

      logger.info('MongoDB连接成功', {
        host: process.env.MCP_DB_HOST,
        database: process.env.MCP_DB_NAME
      });
      return; // Connection successful
    } catch (error) {
      logger.error(`MongoDB连接失败 (尝试 ${i + 1}/${retries})`, { error: error.message });

      if (i === retries - 1) {
        logger.error('达到最大重试次数，无法连接到数据库');
        process.exit(1);
      }

      logger.info(`等待 ${interval}ms 后重试...`);
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
};

// 启动服务器
const PORT = process.env.MCP_SERVER_PORT || 3001;
const HOST = process.env.MCP_SERVER_HOST || '0.0.0.0';

const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, HOST, () => {
    logger.info('MCP服务启动成功', {
      host: HOST,
      port: PORT,
      environment: process.env.MCP_SERVER_ENV || 'production',
      timestamp: new Date().toISOString()
    });

    console.log('========================================');
    console.log('MCP管理控制平台服务');
    console.log('========================================');
    console.log(`服务地址: http://${HOST}:${PORT}`);
    console.log(`健康检查: http://${HOST}:${PORT}/health`);
    console.log(`API文档: http://${HOST}:${PORT}/api/docs`);
    console.log(`管理员账号: ${process.env.MCP_ADMIN_USERNAME}`);
    console.log(`管理员邮箱: ${process.env.MCP_ADMIN_EMAIL}`);
    console.log('========================================');
  });

  // 优雅关闭
  process.on('SIGTERM', () => {
    logger.info('收到SIGTERM信号，开始优雅关闭...');
    server.close(() => {
      logger.info('服务器已关闭');
      mongoose.connection.close(false, () => {
        logger.info('MongoDB连接已关闭');
        process.exit(0);
      });
    });
  });

  process.on('SIGINT', () => {
    logger.info('收到SIGINT信号，开始优雅关闭...');
    server.close(() => {
      logger.info('服务器已关闭');
      mongoose.connection.close(false, () => {
        logger.info('MongoDB连接已关闭');
        process.exit(0);
      });
    });
  });

  // 未捕获的异常处理
  process.on('uncaughtException', (error) => {
    logger.error('未捕获的异常', { error: error.message, stack: error.stack });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('未处理的Promise拒绝', { reason, promise });
  });
};

// 启动服务
startServer().catch(error => {
  logger.error('服务启动失败', { error: error.message });
  process.exit(1);
});

module.exports = app;
