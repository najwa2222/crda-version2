// __tests__/services.test.js
import request from 'supertest';
import app from '../app.js';
import mysql from 'mysql2/promise';

jest.mock('mysql2/promise'); // Make sure this mock is used

describe('Services API', () => {
  let mockConnection;

  beforeAll(() => {
    mockConnection = {
      query: jest.fn(),
    };

    mysql.createConnection.mockResolvedValue(mockConnection);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /getservices', () => {
    it('should redirect to login when user is not authenticated', async () => {
      const response = await request(app).get('/getservices');
      
      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/login?error=not_logged_in');
    });

    it('should return services list when user is authenticated as chef', async () => {
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

      mockConnection.query.mockResolvedValueOnce([mockServices]);

      const response = await request(app)
        .get('/getservices')
        .set('Cookie', ['connect.sid=test-sid'])
        .set('Authorization', 'Bearer test-token');

      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT s.*, IF(r.id IS NOT NULL, \'تم\', \'قيد الانتظار\') AS status')
      );
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(mockServices);
    });
  });
});
