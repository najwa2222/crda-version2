// __tests__/services.test.js
import request from 'supertest';
import app from '../app.js';
import mysql from 'mysql2/promise';

// Mock the `mysql2/promise` module
jest.mock('mysql2/promise');

describe('Services API', () => {
  let mockConnection;

  // Mock query method on the connection
  beforeAll(() => {
    mockConnection = {
      query: jest.fn(),
    };
    // Mock `mysql.createConnection` to return our mock connection
    mysql.createConnection.mockResolvedValue(mockConnection);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /getservices', () => {
    it('should redirect to login when user is not authenticated', async () => {
      // Make a request without authentication headers
      const response = await request(app).get('/getservices');
      
      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/login?error=not_logged_in');
    });

    it('should return services list when user is authenticated as chef', async () => {
      // Mock services data
      const mockServices = [
        {
          id: 1,
          sujet: 'Test Service',
          prenom: 'Test',
          nom: 'User',
          cin: '12345678',
          status: 'قيد الانتظار'
        }
      ];

      // Mock the database query to resolve with the mock services data
      mockConnection.query.mockResolvedValueOnce([mockServices]);

      // Create authenticated session for this request only
      const response = await request(app)
        .get('/getservices')
        .set('Cookie', ['connect.sid=test-sid'])
        .set('Authorization', 'Bearer test-token');
      
      // Ensure that the query method was called with the expected SQL query
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT s.*, IF(r.id IS NOT NULL, \'تم\', \'قيد الانتظار\') AS status')
      );

      // You can also assert response status and data if needed
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(mockServices);
    });
  });
});
