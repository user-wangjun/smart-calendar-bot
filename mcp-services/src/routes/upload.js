const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { OperationLog } = require('../models/models');

const router = express.Router();

// 确保存储目录存在
const uploadDir = path.join(__dirname, '../../uploads/backgrounds');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置 Multer 存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名: timestamp-random.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件格式。仅支持 JPG, PNG, GIF, WebP。'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // 限制 20MB
  }
});

// 上传背景图片接口
router.post('/background', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '未上传文件' });
    }

    // 构建文件 URL (假设静态资源托管在 /uploads 下)
    const fileUrl = `/uploads/backgrounds/${req.file.filename}`;

    // 记录操作日志 (如果有用户信息)
    if (req.user) {
      await OperationLog.create({
        userId: req.user.id,
        action: 'upload',
        resource: 'background',
        details: { filename: req.file.filename, size: req.file.size },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'success'
      });
    }

    res.json({
      success: true,
      url: fileUrl,
      message: '上传成功'
    });
  } catch (error) {
    console.error('上传错误:', error);
    res.status(500).json({
      success: false,
      message: '上传失败: ' + error.message
    });
  }
});

module.exports = router;
