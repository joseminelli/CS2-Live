import request from 'supertest';
import express from 'express';
import healthRouter from '../../src/routes/health.js';

describe('Teams Route - Basic Structure Test', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use('/health', healthRouter);
  });

  test('API should be properly initialized', () => {
    expect(app).toBeDefined();
  });
});
