const express = require('express');
const request = require('supertest');
const authRouter = require('../src/routes/auth');
const jwt = require('jsonwebtoken');
const config = require('../src/config/config');

describe('MCP Auth 路由参数校验', () => {
  test('登录参数校验失败返回400', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'ab', password: '123' });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('刷新令牌缺失返回400', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: '' });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('验证令牌成功返回200', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
    const token = jwt.sign({ userId: 'u1', username: 'u', role: 'admin' }, config.jwt.secret, { expiresIn: '1h' });
    const res = await request(app)
      .get('/api/auth/verify')
      .set('token', token);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('userId');
  });
});
