/**
 * 认证中间件
 * 验证JWT令牌和用户权限
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models/models');
const config = require('../config/config');

const authMiddleware = async (req, res, next) => {
  try {
    // 从请求头获取令牌
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      });
    }

    // 提取令牌
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '令牌格式错误'
      });
    }

    // 验证令牌
    const decoded = jwt.verify(token, config.jwt.secret);

    // 查找用户
    const user = await User.findById(decoded.userId);

    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: '用户不存在或已被禁用'
      });
    }

    // 将用户信息附加到请求对象
    req.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '令牌无效或已过期'
      });
    }

    return res.status(500).json({
      success: false,
      message: '认证失败',
      error: error.message
    });
  }
};

// 权限检查中间件
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未认证'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    next();
  };
};

module.exports = { authMiddleware, checkRole };
