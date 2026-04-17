import request from 'supertest';
import express from 'express';
import healthRouter from '../../src/routes/health.js';

describe('Health Route Integration', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use('/health', healthRouter);
  });

  test('GET /health should return OK status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('status', 'OK');
    expect(response.body.data).toHaveProperty('timestamp');
  });

  test('should return timestamp in ISO format', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    const timestamp = new Date(response.body.data.timestamp);
    expect(timestamp instanceof Date && !isNaN(timestamp)).toBe(true);
  });
});
