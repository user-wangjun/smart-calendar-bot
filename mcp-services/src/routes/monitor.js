/**
 * 监控路由
 * 提供服务监控、健康检查和告警功能
 */

const express = require('express');
const { Service, MonitorLog } = require('../models/models');
const config = require('../config/config');
const axios = require('axios');

const router = express.Router();

// 获取所有服务状态
router.get('/services', async (req, res) => {
  try {
    const services = await Service.find({});
    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取服务列表失败',
      error: error.message
    });
  }
});

// 获取单个服务状态
router.get('/services/:id', async (req, res) => {
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

// 启动服务
router.post('/services/:id/start', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: '服务不存在'
      });
    }

    service.status = 'running';
    service.updatedAt = Date.now();
    await service.save();

    // 记录操作日志
    await MonitorLog.create({
      serviceId: service._id,
      type: 'info',
      level: 'medium',
      message: `服务 ${service.name} 已启动`,
      status: 'resolved'
    });

    res.json({
      success: true,
      message: '服务启动成功',
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务启动失败',
      error: error.message
    });
  }
});

// 停止服务
router.post('/services/:id/stop', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: '服务不存在'
      });
    }

    service.status = 'stopped';
    service.updatedAt = Date.now();
    await service.save();

    // 记录操作日志
    await MonitorLog.create({
      serviceId: service._id,
      type: 'info',
      level: 'medium',
      message: `服务 ${service.name} 已停止`,
      status: 'resolved'
    });

    res.json({
      success: true,
      message: '服务停止成功',
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务停止失败',
      error: error.message
    });
  }
});

// 重启服务
router.post('/services/:id/restart', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: '服务不存在'
      });
    }

    service.status = 'running';
    service.updatedAt = Date.now();
    await service.save();

    // 记录操作日志
    await MonitorLog.create({
      serviceId: service._id,
      type: 'info',
      level: 'medium',
      message: `服务 ${service.name} 已重启`,
      status: 'resolved'
    });

    res.json({
      success: true,
      message: '服务重启成功',
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务重启失败',
      error: error.message
    });
  }
});

// 获取监控日志
router.get('/logs', async (req, res) => {
  try {
    const { serviceId, type, level, status, limit = 100, page = 1 } = req.query;

    const query = {};
    if (serviceId) query.serviceId = serviceId;
    if (type) query.type = type;
    if (level) query.level = level;
    if (status) query.status = status;

    const logs = await MonitorLog.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('serviceId', 'name');

    const total = await MonitorLog.countDocuments(query);

    res.json({
      success: true,
      data: {
        logs,
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
      message: '获取监控日志失败',
      error: error.message
    });
  }
});

// 获取系统概览
router.get('/overview', async (req, res) => {
  try {
    const services = await Service.find({});
    const logs = await MonitorLog.find({})
      .sort({ createdAt: -1 })
      .limit(100);

    const overview = {
      totalServices: services.length,
      runningServices: services.filter(s => s.status === 'running').length,
      stoppedServices: services.filter(s => s.status === 'stopped').length,
      errorServices: services.filter(s => s.status === 'error').length,
      maintenanceServices: services.filter(s => s.status === 'maintenance').length,
      recentLogs: logs.slice(0, 10),
      systemHealth: {
        status: services.some(s => s.status === 'error') ? 'warning' : 'healthy',
        uptime: calculateUptime(services),
        errorRate: calculateErrorRate(logs)
      }
    };

    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取系统概览失败',
      error: error.message
    });
  }
});

// 计算系统运行时间
function calculateUptime (services) {
  const runningServices = services.filter(s => s.status === 'running');
  if (runningServices.length === 0) return 0;

  const avgUptime = runningServices.reduce((sum, s) => {
    return sum + (s.metrics?.uptime || 0);
  }, 0) / runningServices.length;

  return avgUptime;
}

// 计算错误率
function calculateErrorRate (logs) {
  const errorLogs = logs.filter(l => l.type === 'error');
  if (logs.length === 0) return 0;

  return (errorLogs.length / logs.length * 100).toFixed(2);
}

// 执行健康检查
router.post('/health-check', async (req, res) => {
  try {
    const { serviceId } = req.body;

    if (serviceId) {
      // 检查单个服务
      const service = await Service.findById(serviceId);

      if (!service) {
        return res.status(404).json({
          success: false,
          message: '服务不存在'
        });
      }

      if (!service.healthCheck.enabled) {
        return res.json({
          success: true,
          message: '服务未启用健康检查',
          data: service
        });
      }

      // 执行健康检查
      const healthResult = await performHealthCheck(service);

      // 更新服务指标
      service.metrics = {
        ...service.metrics,
        lastCheck: Date.now(),
        avgResponseTime: calculateAvgResponseTime(service, healthResult.responseTime)
      };

      if (healthResult.isHealthy) {
        service.status = 'running';
        service.metrics.successCount = (service.metrics.successCount || 0) + 1;
      } else {
        service.status = 'error';
        service.metrics.errorCount = (service.metrics.errorCount || 0) + 1;

        // 记录错误日志
        await MonitorLog.create({
          serviceId: service._id,
          type: 'error',
          level: 'high',
          message: `健康检查失败: ${healthResult.message}`,
          details: healthResult,
          status: 'pending'
        });
      }

      await service.save();

      res.json({
        success: true,
        message: '健康检查完成',
        data: {
          service: service.name,
          isHealthy: healthResult.isHealthy,
          responseTime: healthResult.responseTime,
          message: healthResult.message
        }
      });
    } else {
      // 检查所有服务
      const services = await Service.find({ healthCheck: { enabled: true } });
      const results = [];

      for (const service of services) {
        const healthResult = await performHealthCheck(service);
        results.push({
          service: service.name,
          isHealthy: healthResult.isHealthy,
          responseTime: healthResult.responseTime,
          message: healthResult.message
        });

        // 更新服务状态
        service.status = healthResult.isHealthy ? 'running' : 'error';
        service.metrics.lastCheck = Date.now();
        await service.save();
      }

      res.json({
        success: true,
        message: '批量健康检查完成',
        data: results
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '健康检查失败',
      error: error.message
    });
  }
});

// 执行健康检查
async function performHealthCheck (service) {
  const startTime = Date.now();

  try {
    const response = await axios.get(service.healthCheck.endpoint, {
      timeout: service.healthCheck.timeout
    });

    const responseTime = Date.now() - startTime;

    if (response.status >= 200 && response.status < 300) {
      return {
        isHealthy: true,
        responseTime,
        message: '服务正常'
      };
    } else {
      return {
        isHealthy: false,
        responseTime,
        message: `HTTP状态码异常: ${response.status}`
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;

    return {
      isHealthy: false,
      responseTime,
      message: error.message || '连接失败'
    };
  }
}

// 计算平均响应时间
function calculateAvgResponseTime (service, newResponseTime) {
  const currentAvg = service.metrics?.avgResponseTime || 0;
  const successCount = service.metrics?.successCount || 1;

  return ((currentAvg * (successCount - 1) + newResponseTime) / successCount).toFixed(2);
}

module.exports = router;
