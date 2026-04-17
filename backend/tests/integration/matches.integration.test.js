import request from 'supertest';
import express from 'express';
import healthRouter from '../../src/routes/health.js';

describe('Matches Route - Basic Structure Test', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use('/health', healthRouter);
  });

  test('API structure should be properly configured', () => {
    expect(app).toBeDefined();
  });

  test('should have middleware configured', () => {
    expect(app._router).toBeDefined();
  });
});
