# MCP管理控制平台服务

## 项目简介

MCP（Management and Control Platform）是一个综合性的服务管理与控制平台，提供统一的服务管理、监控、配置和用户管理功能。

## 功能特性

### 核心功能
- ✅ **用户管理**: 用户注册、登录、权限管理
- ✅ **服务管理**: 服务注册、配置、启停控制
- ✅ **系统监控**: 实时健康检查、性能监控、告警通知
- ✅ **配置管理**: 系统配置、服务配置、批量配置更新
- ✅ **日志审计**: 操作日志、监控日志、错误日志
- ✅ **安全认证**: JWT令牌认证、角色权限控制、API限流

### 技术特性
- 🚀 **高性能**: Express.js + MongoDB，支持高并发
- 🔒 **安全可靠**: Helmet安全头、CORS配置、密码加密
- 📊 **监控告警**: 自动健康检查、邮件告警、性能统计
- 🔄 **自动部署**: PM2进程管理、开机自启、优雅关闭
- 📝 **日志记录**: Winston日志系统、分级日志、日志轮转

## 系统要求

### 硬件要求
- CPU: 2核及以上
- 内存: 4GB及以上
- 磁盘: 20GB及以上可用空间

### 软件要求
- Node.js: >= 16.0.0
- npm: >= 8.0.0
- MongoDB: >= 4.4
- PM2: >= 5.3.0（可选，用于生产环境）

### 网络要求
- 端口: 3001（可配置）
- 外网访问: 如需远程访问，需要配置防火墙规则

## 快速开始

### 1. 安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd mcp-services

# 安装依赖
npm install
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置文件
nano .env
```

**重要配置项**：
- `MCP_SERVER_HOST`: 服务器地址（默认: 0.0.0.0）
- `MCP_SERVER_PORT`: 服务端口（默认: 3001）
- `MCP_DB_HOST`: MongoDB地址（默认: localhost）
- `MCP_DB_PORT`: MongoDB端口（默认: 27017）
- `MCP_DB_NAME`: 数据库名称（默认: mcp_management_db）
- `MCP_ADMIN_USERNAME`: 管理员用户名（默认: admin）
- `MCP_ADMIN_PASSWORD`: 管理员密码（默认: Admin@2024）
- `MCP_JWT_SECRET`: JWT密钥（**必须修改**）

### 3. 初始化数据库

```bash
# 启动MongoDB服务
mongod --dbpath /data/db

# 运行安装脚本
npm run setup
```

### 4. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式（使用PM2）
npm run deploy
```

### 5. 访问服务

- **服务地址**: http://localhost:3001
- **健康检查**: http://localhost:3001/health
- **API文档**: http://localhost:3001/api/docs

## API文档

### 认证接口

#### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "Admin@2024"
}
```

#### 刷新令牌
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your_refresh_token"
}
```

### 服务管理接口

#### 获取服务列表
```http
GET /api/services
Authorization: Bearer <your_token>
```

#### 注册新服务
```http
POST /api/services
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "name": "weather-service",
  "type": "api",
  "config": {
    "host": "api.example.com",
    "port": 8080,
    "endpoint": "/api/v1/weather"
  },
  "healthCheck": {
    "enabled": true,
    "interval": 30000,
    "timeout": 10000,
    "endpoint": "http://api.example.com/health"
  }
}
```

#### 启动服务
```http
POST /api/services/:id/start
Authorization: Bearer <your_token>
```

#### 停止服务
```http
POST /api/services/:id/stop
Authorization: Bearer <your_token>
```

### 监控接口

#### 获取系统概览
```http
GET /api/monitor/overview
Authorization: Bearer <your_token>
```

#### 执行健康检查
```http
POST /api/monitor/health-check
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "serviceId": "service_id_here"
}
```

#### 获取监控日志
```http
GET /api/monitor/logs?page=1&limit=20&level=high
Authorization: Bearer <your_token>
```

### 配置管理接口

#### 获取配置列表
```http
GET /api/config
Authorization: Bearer <your_token>
```

#### 更新配置
```http
PUT /api/config/:key
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "value": "new_value",
  "category": "system",
  "description": "配置描述"
}
```

## 部署指南

### 开发环境部署

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑.env文件

# 3. 启动开发服务器
npm run dev
```

### 生产环境部署

```bash
# 1. 运行安装脚本
npm run install

# 2. 配置生产环境变量
nano .env
# 修改MCP_SERVER_ENV=production

# 3. 运行部署脚本
npm run deploy
```

### 使用PM2管理

```bash
# 查看服务状态
pm2 list

# 查看服务日志
pm2 logs mcp-platform

# 重启服务
pm2 restart mcp-platform

# 停止服务
pm2 stop mcp-platform
```

## 监控和告警

### 健康检查

系统会自动执行健康检查，检查间隔可通过环境变量配置：

```bash
# 健康检查间隔（毫秒）
MCP_HEALTH_CHECK_INTERVAL=30000

# 健康检查超时（毫秒）
MCP_HEALTH_CHECK_TIMEOUT=10000
```

### 告警配置

当服务连续失败达到阈值时，系统会自动发送告警邮件：

```bash
# 告警邮件地址
MCP_MONITOR_ALERT_EMAIL=alerts@mcp-platform.com

# 邮件服务配置
MCP_EMAIL_SERVICE=smtp
MCP_EMAIL_HOST=smtp.gmail.com
MCP_EMAIL_PORT=587
MCP_EMAIL_USER=your-email@gmail.com
MCP_EMAIL_PASSWORD=your-email-password
```

### 手动健康检查

```bash
# 执行单次健康检查
npm run health --once

# 启动持续健康检查
npm run health

# 生成健康检查报告
npm run health --report
```

## 日志管理

### 日志文件位置

- **错误日志**: `logs/error.log`
- **综合日志**: `logs/combined.log`
- **服务日志**: `logs/mcp-service.log`
- **健康检查日志**: `logs/health-check.log`

### 日志级别

可通过环境变量配置日志级别：

```bash
# 日志级别: debug, info, warn, error
MCP_LOG_LEVEL=info
```

## 安全配置

### JWT认证

所有API接口（除登录接口）都需要JWT令牌认证：

```bash
# JWT密钥（生产环境必须修改）
MCP_JWT_SECRET=your_secure_random_secret_key_here

# 令牌过期时间
MCP_JWT_EXPIRES_IN=7d
MCP_JWT_REFRESH_EXPIRES_IN=30d
```

### API限流

防止API滥用，配置限流规则：

```bash
# 限流窗口（分钟）
MCP_RATE_LIMIT_WINDOW=15

# 最大请求数
MCP_RATE_LIMIT_MAX=100
```

### CORS配置

配置跨域访问：

```bash
# 启用CORS
MCP_CORS_ENABLED=true

# 允许的源
MCP_CORS_ORIGIN=*
```

## 备份和恢复

### 自动备份

系统支持自动备份功能：

```bash
# 启用备份
MCP_BACKUP_ENABLED=true

# 备份间隔（毫秒）
MCP_BACKUP_INTERVAL=86400000

# 备份路径
MCP_BACKUP_PATH=./backups

# 备份保留天数
MCP_BACKUP_RETENTION_DAYS=30
```

### 手动备份

```bash
# 备份数据库
mongodump --db mcp_management_db --out backup-$(date +%Y%m%d).bson

# 备份配置文件
cp .env .env.backup-$(date +%Y%m%d)
```

## 故障排除

### 常见问题

#### 1. 服务无法启动

**问题**: 服务启动失败，端口被占用

**解决方案**:
```bash
# 检查端口占用
netstat -ano | findstr :3001

# 修改.env中的端口配置
MCP_SERVER_PORT=3002
```

#### 2. 数据库连接失败

**问题**: 无法连接到MongoDB

**解决方案**:
```bash
# 检查MongoDB服务状态
mongod --version
mongo --eval "db.version()"

# 检查数据库连接配置
# 确认MCP_DB_HOST、MCP_DB_PORT、MCP_DB_NAME配置正确
```

#### 3. 健康检查失败

**问题**: 健康检查持续失败

**解决方案**:
```bash
# 查看健康检查日志
cat logs/health-check.log

# 检查服务状态
curl http://localhost:3001/health

# 查看服务日志
pm2 logs mcp-platform --lines 50
```

#### 4. 权限不足

**问题**: API返回403权限错误

**解决方案**:
```bash
# 确认JWT令牌有效
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/auth/verify

# 检查用户角色
# 只有admin和operator角色可以执行管理操作
```

## 性能优化

### 数据库优化

```bash
# 创建索引
mongo mcp_management_db --eval "db.users.createIndex({username: 1}, {unique: true})"
mongo mcp_management_db --eval "db.services.createIndex({name: 1}, {unique: true})"
```

### 缓存配置

```bash
# 启用缓存
MCP_CACHE_ENABLED=true

# 缓存过期时间（秒）
MCP_CACHE_TTL=3600

# 最大缓存条目数
MCP_CACHE_MAX_SIZE=1000
```

### PM2优化

```bash
# 增加实例数
MCP_PM2_INSTANCES=4

# 设置内存限制
MCP_PM2_MAX_MEMORY_RESTART=2G
```

## 贡献指南

欢迎贡献代码、报告问题或提出新功能建议：

1. Fork项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 联系方式

- **项目主页**: [项目地址]
- **问题反馈**: [Issues页面]
- **文档**: [Wiki页面]
- **邮箱**: support@mcp-platform.com

---

**版本**: 1.0.0  
**最后更新**: 2026年1月29日
