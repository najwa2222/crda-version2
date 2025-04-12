import request from 'supertest';
import app from '../app.js';
import mysql from 'mysql2/promise';

// Mock mysql2/promise
jest.mock('mysql2/promise');

describe('DELETE API Endpoints', () => {
  let mockConnection;

  // Mock connection and ensure mock queries are available
  beforeAll(() => {
    mockConnection = {
      query: jest.fn(),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
    };
    // Mock `createConnection` to return our mock connection
    mysql.createConnection.mockResolvedValue(mockConnection);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DELETE /api/services/:id', () => {
    it('should delete a service when authenticated', async () => {
      // Mock successful deletion
      mockConnection.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      // Simulate authenticated user with a chef role
      const response = await request(app)
        .delete('/api/services/1')
        .set('Cookie', ['connect.sid=test-sid']) // Use the mock session cookie
        .set('Authorization', 'Bearer test-token'); // Mock authorization header

      expect(mockConnection.query).toHaveBeenCalledWith(
        'DELETE FROM services_utilisateur WHERE id = ?',
        ['1']
      );
      expect(response.statusCode).toBe(200); // Assuming 200 for successful deletion
    });
  });

  describe('DELETE /api/reports/:id', () => {
    it('should delete a report and related results in a transaction', async () => {
      // Mock report exists
      mockConnection.query.mockResolvedValueOnce([[{ cin: '12345678', sujet: 'Test Subject' }]]);
      // Mock delete from results
      mockConnection.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
      // Mock delete from rapport
      mockConnection.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      // Perform the DELETE request
      await request(app)
        .delete('/api/reports/1')
        .set('Cookie', ['connect.sid=test-sid']) // Set the mock session cookie
        .set('Authorization', 'Bearer test-token'); // Mock authorization header

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenNthCalledWith(
        1,
        'SELECT cin, sujet FROM rapport WHERE id = ?',
        ['1']
      );
      expect(mockConnection.query).toHaveBeenNthCalledWith(
        2,
        'DELETE FROM results WHERE cin = ?',
        ['12345678']
      );
      expect(mockConnection.query).toHaveBeenNthCalledWith(
        3,
        'DELETE FROM rapport WHERE id = ?',
        ['1']
      );
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    it('should rollback transaction when report is not found', async () => {
      // Mock report doesn't exist
      mockConnection.query.mockResolvedValueOnce([[]]); // Simulate no report found

      await request(app)
        .delete('/api/reports/999')
        .set('Cookie', ['connect.sid=test-sid']) // Mock session cookie
        .set('Authorization', 'Bearer test-token'); // Mock authorization header

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.rollback).toHaveBeenCalled();
      // In real test, this would return a 404 error, simulate rollback on no report
    });
  });
});
