/**
 * MongoDB数据库模型定义
 * 定义用户、服务、配置和监控相关的数据模型
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 用户模型
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'operator', 'viewer'],
    default: 'viewer'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 密码加密中间件
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 密码验证方法
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// 服务模型
const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['api', 'database', 'cache', 'message', 'storage'],
    required: true
  },
  status: {
    type: String,
    enum: ['running', 'stopped', 'error', 'maintenance'],
    default: 'stopped'
  },
  config: {
    host: String,
    port: Number,
    endpoint: String,
    apiKey: String,
    timeout: Number,
    retryCount: Number
  },
  metrics: {
    uptime: Number,
    lastCheck: Date,
    errorCount: Number,
    successCount: Number,
    avgResponseTime: Number
  },
  healthCheck: {
    enabled: { type: Boolean, default: true },
    interval: { type: Number, default: 30000 },
    endpoint: String,
    timeout: { type: Number, default: 10000 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 配置模型
const configSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  category: {
    type: String,
    enum: ['system', 'service', 'security', 'monitoring'],
    default: 'system'
  },
  description: {
    type: String,
    maxlength: 500
  },
  isEncrypted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 监控日志模型
const monitorLogSchema = new mongoose.Schema({
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  type: {
    type: String,
    enum: ['health_check', 'error', 'warning', 'info'],
    required: true
  },
  level: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    required: true
  },
  message: {
    type: String,
    required: true,
    maxlength: 2000
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['resolved', 'pending', 'ignored'],
    default: 'pending'
  },
  resolvedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 操作日志模型
const operationLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  action: {
    type: String,
    required: true,
    enum: ['create', 'update', 'delete', 'start', 'stop', 'restart', 'deploy']
  },
  resource: {
    type: String,
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  ipAddress: String,
  userAgent: String,
  status: {
    type: String,
    enum: ['success', 'failure', 'partial'],
    required: true
  },
  errorMessage: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 创建模型
const User = mongoose.model('User', userSchema);
const Service = mongoose.model('Service', serviceSchema);
const Config = mongoose.model('Config', configSchema);
const MonitorLog = mongoose.model('MonitorLog', monitorLogSchema);
const OperationLog = mongoose.model('OperationLog', operationLogSchema);

module.exports = {
  User,
  Service,
  Config,
  MonitorLog,
  OperationLog
};
