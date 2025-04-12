// __tests__/example.test.js
import request from 'supertest';
import app from '../app.js'; // Import your app
import mysql from 'mysql2/promise'; // This should be mocked

describe('Example API', () => {
  let mockConnection;

  beforeAll(async () => {
    // Get the mock connection from the mocked mysql2/promise
    mockConnection = await mysql.createConnection({});
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 OK and data from MySQL', async () => {
    // Mock the MySQL query response
    mockConnection.query.mockResolvedValueOnce([{ id: 1, name: 'Test' }]);

    const response = await request(app)
      .get('/example-route') // Replace with your actual route
      .set('Cookie', ['connect.sid=test-sid'])
      .set('Authorization', 'Bearer test-token');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([{ id: 1, name: 'Test' }]);
    expect(mockConnection.query).toHaveBeenCalledWith('SELECT * FROM example_table');
  });

  it('should return 500 when MySQL query fails', async () => {
    // Mock the MySQL query to fail
    mockConnection.query.mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app)
      .get('/example-route')
      .set('Cookie', ['connect.sid=test-sid'])
      .set('Authorization', 'Bearer test-token');

    expect(response.statusCode).toBe(500);
    expect(response.text).toBe('Database error');
  });
});
