/**
 * 配置路由
 * 处理系统配置管理
 */

const express = require('express');
const { Config, OperationLog } = require('../models/models');

const router = express.Router();

// 获取所有配置
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;

    const query = {};
    if (category) query.category = category;
    if (search) {
      query.key = { $regex: search, $options: 'i' };
    }

    const configs = await Config.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: configs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取配置列表失败',
      error: error.message
    });
  }
});

// 获取单个配置
router.get('/:key', async (req, res) => {
  try {
    const config = await Config.findOne({ key: req.params.key });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: '配置不存在'
      });
    }

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取配置失败',
      error: error.message
    });
  }
});

// 创建或更新配置
router.put('/:key', async (req, res) => {
  try {
    const { value, category, description, isEncrypted } = req.body;

    if (value === undefined) {
      return res.status(400).json({
        success: false,
        message: '配置值不能为空'
      });
    }

    let config = await Config.findOne({ key: req.params.key });

    if (config) {
      // 更新现有配置
      config.value = value;
      if (category) config.category = category;
      if (description) config.description = description;
      if (isEncrypted !== undefined) config.isEncrypted = isEncrypted;
      config.updatedAt = Date.now();

      await config.save();

      await OperationLog.create({
        userId: req.user.id,
        action: 'update',
        resource: 'config',
        resourceId: config._id,
        details: { key: req.params.key, category },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'success'
      });

      res.json({
        success: true,
        message: '配置更新成功',
        data: config
      });
    } else {
      // 创建新配置
      config = new Config({
        key: req.params.key,
        value,
        category: category || 'system',
        description: description || '',
        isEncrypted: isEncrypted || false
      });

      await config.save();

      await OperationLog.create({
        userId: req.user.id,
        action: 'create',
        resource: 'config',
        resourceId: config._id,
        details: { key: req.params.key, category },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'success'
      });

      res.status(201).json({
        success: true,
        message: '配置创建成功',
        data: config
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '配置保存失败',
      error: error.message
    });
  }
});

// 删除配置
router.delete('/:key', async (req, res) => {
  try {
    const config = await Config.findOne({ key: req.params.key });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: '配置不存在'
      });
    }

    await Config.deleteOne({ key: req.params.key });

    await OperationLog.create({
      userId: req.user.id,
      action: 'delete',
      resource: 'config',
      resourceId: config._id,
      details: { key: req.params.key },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: '配置删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '配置删除失败',
      error: error.message
    });
  }
});

// 批量更新配置
router.post('/batch', async (req, res) => {
  try {
    const { configs } = req.body;

    if (!configs || !Array.isArray(configs)) {
      return res.status(400).json({
        success: false,
        message: '配置列表格式错误'
      });
    }

    const results = [];

    for (const configData of configs) {
      const { key, value, category, description } = configData;

      if (!key || value === undefined) {
        results.push({
          key,
          success: false,
          message: '配置项不完整'
        });
        continue;
      }

      let config = await Config.findOne({ key });

      if (config) {
        config.value = value;
        if (category) config.category = category;
        if (description) config.description = description;
        config.updatedAt = Date.now();
        await config.save();

        results.push({
          key,
          success: true,
          message: '配置更新成功'
        });
      } else {
        config = new Config({
          key,
          value,
          category: category || 'system',
          description: description || ''
        });
        await config.save();

        results.push({
          key,
          success: true,
          message: '配置创建成功'
        });
      }
    }

    await OperationLog.create({
      userId: req.user.id,
      action: 'update',
      resource: 'config',
      details: { count: configs.length },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: '批量配置更新完成',
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '批量配置更新失败',
      error: error.message
    });
  }
});

module.exports = router;
