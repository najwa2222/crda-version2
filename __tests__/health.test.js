import request from 'supertest';
import app from '../app.js';
import mysql from 'mysql2/promise';

// Mock mysql2/promise
jest.mock('mysql2/promise');

describe('Health Check API', () => {
  let mockConnection;

  beforeAll(() => {
    // Mock the mysql2 connection to return a mock connection with query method
    mockConnection = {
      query: jest.fn(),
    };
    // Mock `mysql.createConnection` to return the mock connection
    mysql.createConnection.mockResolvedValue(mockConnection);
  });

  beforeEach(() => {
    // Clear any previous mock calls before each test
    jest.clearAllMocks();
  });

  it('should return 200 OK when database is connected', async () => {
    // Mock the database query to succeed
    mockConnection.query.mockResolvedValueOnce([{ '1': 1 }]);

    const response = await request(app).get('/health');
    
    // Verify the response status and content
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('OK');
    // Ensure the correct query was executed
    expect(mockConnection.query).toHaveBeenCalledWith('SELECT 1');
  });

  it('should return 500 when database query fails', async () => {
    // Mock the database query to fail
    mockConnection.query.mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app).get('/health');
    
    // Verify the response status and content for failure
    expect(response.statusCode).toBe(500);
    expect(response.text).toBe('DB query failed');
  });
});
