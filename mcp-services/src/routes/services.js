/**
 * 服务路由
 * 处理服务注册、配置和管理
 */

const express = require('express');
const { Service, OperationLog } = require('../models/models');

const router = express.Router();

// 获取所有服务
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;

    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;

    const services = await Service.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Service.countDocuments(query);

    res.json({
      success: true,
      data: {
        services,
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
      message: '获取服务列表失败',
      error: error.message
    });
  }
});

// 获取单个服务
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: '服务不存在'
      });
    }

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取服务信息失败',
      error: error.message
    });
  }
});

// 注册新服务
router.post('/', async (req, res) => {
  try {
    const { name, type, config, healthCheck } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: '服务名称和类型不能为空'
      });
    }

    const existingService = await Service.findOne({ name });

    if (existingService) {
      return res.status(400).json({
        success: false,
        message: '服务名称已存在'
      });
    }

    const service = new Service({
      name,
      type,
      config: config || {},
      status: 'stopped',
      healthCheck: healthCheck || {
        enabled: true,
        interval: 30000,
        timeout: 10000
      },
      metrics: {
        uptime: 0,
        errorCount: 0,
        successCount: 0,
        avgResponseTime: 0
      }
    });

    await service.save();

    await OperationLog.create({
      userId: req.user.id,
      action: 'create',
      resource: 'service',
      resourceId: service._id,
      details: { name, type, config },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.status(201).json({
      success: true,
      message: '服务注册成功',
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务注册失败',
      error: error.message
    });
  }
});

// 更新服务配置
router.put('/:id', async (req, res) => {
  try {
    const { name, type, config, healthCheck } = req.body;

    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: '服务不存在'
      });
    }

    if (name) service.name = name;
    if (type) service.type = type;
    if (config) service.config = { ...service.config, ...config };
    if (healthCheck) service.healthCheck = { ...service.healthCheck, ...healthCheck };

    service.updatedAt = Date.now();
    await service.save();

    await OperationLog.create({
      userId: req.user.id,
      action: 'update',
      resource: 'service',
      resourceId: service._id,
      details: { name, type, config, healthCheck },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: '服务更新成功',
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务更新失败',
      error: error.message
    });
  }
});

// 删除服务
router.delete('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: '服务不存在'
      });
    }

    await Service.findByIdAndDelete(req.params.id);

    await OperationLog.create({
      userId: req.user.id,
      action: 'delete',
      resource: 'service',
      resourceId: service._id,
      details: { name: service.name, type: service.type },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: '服务删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务删除失败',
      error: error.message
    });
  }
});

module.exports = router;
