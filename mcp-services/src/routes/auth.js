/**
 * 认证路由
 * 处理用户登录、注册和JWT令牌管理
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models/models');
const config = require('../config/config');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// 用户登录
router.post('/login',
  [
    body('username').isString().trim().isLength({ min: 3 }).withMessage('用户名格式不正确'),
    body('password').isString().isLength({ min: 6 }).withMessage('密码格式不正确')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: '参数校验失败', errors: errors.array() });
      }
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: '用户名和密码不能为空'
        });
      }

      const user = await User.findOne({
        $or: [
          { username },
          { email: username }
        ],
        status: 'active'
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        });
      }

      const isMatch = await user.comparePassword(password);

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        });
      }

      // 更新最后登录时间
      user.lastLogin = Date.now();
      await user.save();

      // 生成JWT令牌
      const token = jwt.sign(
        {
          userId: user._id,
          username: user.username,
          role: user.role
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      // 生成刷新令牌
      const refreshToken = jwt.sign(
        { userId: user._id },
        config.jwt.secret,
        { expiresIn: config.jwt.refreshExpiresIn }
      );

      res.json({
        success: true,
        message: '登录成功',
        data: {
          token,
          refreshToken,
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '登录失败',
        error: error.message
      });
    }
  });

// 刷新令牌
router.post('/refresh',
  [
    body('refreshToken').isString().isLength({ min: 10 }).withMessage('刷新令牌格式不正确')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: '参数校验失败', errors: errors.array() });
      }
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: '刷新令牌不能为空'
        });
      }

      const decoded = jwt.verify(refreshToken, config.jwt.secret);

      const user = await User.findById(decoded.userId);

      if (!user || user.status !== 'active') {
        return res.status(401).json({
          success: false,
          message: '用户不存在或已被禁用'
        });
      }

      // 生成新的访问令牌
      const newToken = jwt.sign(
        {
          userId: user._id,
          username: user.username,
          role: user.role
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      res.json({
        success: true,
        message: '令牌刷新成功',
        data: {
          token: newToken
        }
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: '刷新令牌无效或已过期',
        error: error.message
      });
    }
  });

// 用户登出
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: '登出成功'
  });
});

// 验证令牌
router.get('/verify', (req, res) => {
  try {
    const { token } = req.headers;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '令牌不能为空'
      });
    }

    const decoded = jwt.verify(token, config.jwt.secret);

    res.json({
      success: true,
      message: '令牌有效',
      data: {
        userId: decoded.userId,
        username: decoded.username,
        role: decoded.role,
        expiresIn: decoded.exp - Math.floor(Date.now() / 1000)
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: '令牌无效或已过期',
      error: error.message
    });
  }
});

module.exports = router;
