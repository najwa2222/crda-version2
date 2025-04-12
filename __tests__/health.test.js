// __tests__/health.test.js
import request from 'supertest';
import app from '../app.js';
import mysql from 'mysql2/promise';

// Mock connection should be imported in test files
const mockConnection = await mysql.createConnection({});

describe('Health Check API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 OK when database is connected', async () => {
    // Mock the database query to succeed
    mockConnection.query.mockResolvedValueOnce([{ '1': 1 }]);

    const response = await request(app).get('/health');
    
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('OK');
    expect(mockConnection.query).toHaveBeenCalledWith('SELECT 1');
  });

  it('should return 503 when database query fails', async () => {
    // Mock the database query to fail
    mockConnection.query.mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app).get('/health');
    
    expect(response.statusCode).toBe(500);
    expect(response.text).toBe('DB query failed');
  });
});