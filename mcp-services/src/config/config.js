/**
 * MCP服务配置文件
 * 集中管理所有服务配置
 */

module.exports = {
  // 服务器配置
  server: {
    host: process.env.MCP_SERVER_HOST || '0.0.0.0',
    port: parseInt(process.env.MCP_SERVER_PORT) || 3001,
    env: process.env.MCP_SERVER_ENV || 'production'
  },

  // 数据库配置
  database: {
    host: process.env.MCP_DB_HOST || 'localhost',
    port: parseInt(process.env.MCP_DB_PORT) || 27017,
    name: process.env.MCP_DB_NAME || 'mcp_management_db',
    username: process.env.MCP_DB_USERNAME || 'mcp_admin',
    password: process.env.MCP_DB_PASSWORD || 'your_secure_password_here',
    poolSize: parseInt(process.env.MCP_DB_POOL_SIZE) || 10,
    timeout: parseInt(process.env.MCP_DB_TIMEOUT) || 30000,
    reconnectInterval: parseInt(process.env.MCP_DB_RECONNECT_INTERVAL) || 5000
  },

  // JWT认证配置
  jwt: {
    secret: process.env.MCP_JWT_SECRET || 'your_jwt_secret_key_change_this_in_production',
    expiresIn: process.env.MCP_JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.MCP_JWT_REFRESH_EXPIRES_IN || '30d'
  },

  // 管理员配置
  admin: {
    username: process.env.MCP_ADMIN_USERNAME || 'admin',
    email: process.env.MCP_ADMIN_EMAIL || 'admin@mcp-platform.com',
    password: process.env.MCP_ADMIN_PASSWORD || 'Admin@2024'
  },

  // 日志配置
  logging: {
    level: process.env.MCP_LOG_LEVEL || 'info',
    filePath: process.env.MCP_LOG_FILE_PATH || './logs/mcp-service.log',
    maxSize: process.env.MCP_LOG_MAX_SIZE || '20m',
    maxFiles: parseInt(process.env.MCP_LOG_MAX_FILES) || 5
  },

  // API限流配置
  rateLimit: {
    windowMs: (parseInt(process.env.MCP_RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
    max: parseInt(process.env.MCP_RATE_LIMIT_MAX) || 100,
    skipFailedRequests: process.env.MCP_RATE_LIMIT_SKIP_FAILED_REQUESTS === 'true'
  },

  // 监控配置
  monitoring: {
    healthCheckInterval: parseInt(process.env.MCP_HEALTH_CHECK_INTERVAL) || 30000,
    healthCheckTimeout: parseInt(process.env.MCP_HEALTH_CHECK_TIMEOUT) || 10000,
    alertEmail: process.env.MCP_MONITOR_ALERT_EMAIL || 'alerts@mcp-platform.com'
  },

  // 邮件服务配置
  email: {
    service: process.env.MCP_EMAIL_SERVICE || 'smtp',
    host: process.env.MCP_EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MCP_EMAIL_PORT) || 587,
    secure: process.env.MCP_EMAIL_SECURE === 'true',
    user: process.env.MCP_EMAIL_USER || 'your-email@gmail.com',
    password: process.env.MCP_EMAIL_PASSWORD || 'your-email-password',
    from: process.env.MCP_EMAIL_FROM || 'MCP Platform <noreply@mcp-platform.com>'
  },

  // 备份配置
  backup: {
    enabled: process.env.MCP_BACKUP_ENABLED === 'true',
    interval: parseInt(process.env.MCP_BACKUP_INTERVAL) || 86400000,
    path: process.env.MCP_BACKUP_PATH || './backups',
    retentionDays: parseInt(process.env.MCP_BACKUP_RETENTION_DAYS) || 30
  },

  // 缓存配置
  cache: {
    enabled: process.env.MCP_CACHE_ENABLED === 'true',
    ttl: parseInt(process.env.MCP_CACHE_TTL) || 3600,
    maxSize: parseInt(process.env.MCP_CACHE_MAX_SIZE) || 1000
  },

  // 安全配置
  security: {
    corsEnabled: process.env.MCP_CORS_ENABLED !== 'false',
    corsOrigin: process.env.MCP_CORS_ORIGIN || '*',
    helmetEnabled: process.env.MCP_HELMET_ENABLED !== 'false',
    rateLimitEnabled: process.env.MCP_RATE_LIMIT_ENABLED !== 'false'
  },

  // PM2配置
  pm2: {
    instances: parseInt(process.env.MCP_PM2_INSTANCES) || 2,
    maxMemoryRestart: process.env.MCP_PM2_MAX_MEMORY_RESTART || '1G',
    minUptime: process.env.MCP_PM2_MIN_UPTIME || '10s'
  }
};
