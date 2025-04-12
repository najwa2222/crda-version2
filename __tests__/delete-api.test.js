// __tests__/delete-api.test.js
import request from 'supertest';
import app from '../app.js';
import mysql from 'mysql2/promise';

// Mock connection
const mockConnection = await mysql.createConnection({});

describe('DELETE API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DELETE /api/services/:id', () => {
    it('should delete a service when authenticated', async () => {
      // Mock successful deletion
      mockConnection.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      // We'll need to mock authentication for this test
      // This is a simplified example - in real tests you would need to
      // properly set up the session with a user

      const app_with_user = request(app);
      // Simulate authenticated user with a chef role
      app_with_user.session = { user: { id: 1, role_user: 'chef_dentreprise' } };

      const response = await app_with_user
        .delete('/api/services/1')
        .send();

      // This would fail in real tests without proper session mocking
      expect(mockConnection.query).toHaveBeenCalledWith(
        'DELETE FROM services_utilisateur WHERE id = ?',
        ['1']
      );
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

      // Again, this is a simplified example showing the pattern
      const response = await request(app)
        .delete('/api/reports/1')
        .send();

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenNthCalledWith(
        1,
        'SELECT cin, sujet FROM rapport WHERE id = ?',
        ['1']
      );
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    it('should rollback transaction when report is not found', async () => {
      // Mock report doesn't exist
      mockConnection.query.mockResolvedValueOnce([[]]);

      const response = await request(app)
        .delete('/api/reports/999')
        .send();

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.rollback).toHaveBeenCalled();
      // In real test this would return a 404
    });
  });
});