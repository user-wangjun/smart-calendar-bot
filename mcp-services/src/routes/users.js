/**
 * 用户路由
 * 处理用户管理相关操作
 */

const express = require('express');
const { User, OperationLog } = require('../models/models');
const bcrypt = require('bcryptjs');

const router = express.Router();

// 获取用户列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, role, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      error: error.message
    });
  }
});

// 获取单个用户信息
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error.message
    });
  }
});

// 创建用户
router.post('/', async (req, res) => {
  try {
    const { username, email, password, role = 'viewer' } = req.body;

    // 验证必填字段
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名、邮箱和密码不能为空'
      });
    }

    // 检查用户名是否已存在
    const existingUser = await User.findOne({
      $or: [
        { username },
        { email }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名或邮箱已存在'
      });
    }

    // 创建新用户
    const user = new User({
      username,
      email,
      password,
      role,
      status: 'active'
    });

    await user.save();

    // 记录操作日志
    await OperationLog.create({
      userId: req.user.id,
      action: 'create',
      resource: 'user',
      resourceId: user._id,
      details: { username, email, role },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.status(201).json({
      success: true,
      message: '用户创建成功',
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '用户创建失败',
      error: error.message
    });
  }
});

// 更新用户信息
router.put('/:id', async (req, res) => {
  try {
    const { username, email, role, status } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 更新用户信息
    if (username) user.username = username;
    if (email) user.email = email;
    if (role) user.role = role;
    if (status) user.status = status;

    user.updatedAt = Date.now();
    await user.save();

    // 记录操作日志
    await OperationLog.create({
      userId: req.user.id,
      action: 'update',
      resource: 'user',
      resourceId: user._id,
      details: { username, email, role, status },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: '用户更新成功',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '用户更新失败',
      error: error.message
    });
  }
});

// 删除用户
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 不允许删除管理员
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: '不允许删除管理员账号'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    // 记录操作日志
    await OperationLog.create({
      userId: req.user.id,
      action: 'delete',
      resource: 'user',
      resourceId: user._id,
      details: { username: user.username, email: user.email },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: '用户删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '用户删除失败',
      error: error.message
    });
  }
});

// 重置用户密码
router.post('/:id/reset-password', async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '新密码长度不能少于6位'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    user.password = newPassword;
    await user.save();

    // 记录操作日志
    await OperationLog.create({
      userId: req.user.id,
      action: 'update',
      resource: 'user',
      resourceId: user._id,
      details: { action: 'reset_password' },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: '密码重置成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '密码重置失败',
      error: error.message
    });
  }
});

module.exports = router;
