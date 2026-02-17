const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/models/models', () => {
  const mockUser = {
    _id: 'u1',
    username: 'tester',
    email: 't@example.com',
    role: 'admin',
    status: 'active',
    lastLogin: null,
    comparePassword: async (pwd) => pwd === 'correct_password',
    save: async () => {}
  };
  return {
    User: {
      findOne: async (query) => {
        if (query.status === 'active') return mockUser;
        return null;
      },
      findById: async () => mockUser
    }
  };
});

const config = require('../src/config/config');
const authRouter = require('../src/routes/auth');

describe('MCP Auth 登录成功路径', () => {
  test('登录成功返回token与refreshToken', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'tester', password: 'correct_password' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data).toHaveProperty('refreshToken');
  });

  test('刷新令牌成功返回新token', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
    const refreshToken = jwt.sign({ userId: 'u1' }, config.jwt.secret, { expiresIn: '1h' });
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
  });

  test('登出返回成功', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
    const res = await request(app)
      .post('/api/auth/logout')
      .send({});
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
