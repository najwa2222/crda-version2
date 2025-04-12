import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';

jest.mock('mysql2/promise', () => ({
  createConnection: jest.fn(),
  createPool: jest.fn(),
  // For default import compatibility
  default: {
    createConnection: jest.fn()
  }
}));

describe('Health Check API', () => {
  let server;

  beforeAll(async () => {
    server = app.listen(0);
    await new Promise(resolve => server.on('listening', resolve));
  });

  afterAll(async () => {
    server.closeAllConnections();
    await new Promise(resolve => {
      server.close(() => {
        console.log('Test server closed');
        resolve();
      });
      setTimeout(resolve, 500).unref();
    });
  });

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it('should return 200 OK', async () => {
    const mysql = await import('mysql2/promise');
    mysql.default.createConnection.mockResolvedValue({
      query: jest.fn().mockResolvedValue([[{ '1': 1 }]]),
      end: jest.fn().mockResolvedValue(true)
    });

    const response = await request(app).get('/health');
    expect(response.statusCode).toBe(200);
  }, 15000);

  it('should return 500 on DB failure', async () => {
    const mysql = await import('mysql2/promise');
    mysql.default.createConnection.mockRejectedValue(new Error('DB error'));

    const response = await request(app).get('/health');
    expect(response.statusCode).toBe(500);
  }, 15000);
});