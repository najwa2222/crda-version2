// __tests__/auth.test.js
import request from 'supertest';
import app from '../app.js';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn()
}));

// Mock connection should be imported in test files
const mockConnection = await mysql.createConnection({});

describe('Authentication API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /login', () => {
    it('should redirect to error page when credentials are invalid', async () => {
      // Mock empty results for user query
      mockConnection.query.mockResolvedValueOnce([[]]);

      const response = await request(app)
        .post('/login')
        .send({
          email_user: 'nonexistent@crda.com',
          password_user: 'wrongpassword'
        });

      expect(response.statusCode).toBe(302); // Redirect
      expect(response.headers.location).toBe('/login?error=invalid_credentials');
      expect(mockConnection.query).toHaveBeenCalledWith(
        'SELECT * FROM utilisateur WHERE email_user = ?',
        ['nonexistent@crda.com']
      );
    });

    it('should redirect to dashboard when credentials are valid', async () => {
      // Mock user exists in database
      const mockUser = {
        id: 1,
        email_user: 'test@crda.com',
        password_user: 'hashedPassword',
        role_user: 'chef_dentreprise',
        status_user: 'approved',
        nom_user: 'Test',
        prenom_user: 'User'
      };
      
      mockConnection.query.mockResolvedValueOnce([[mockUser]]);
      bcrypt.compare.mockResolvedValueOnce(true);

      const response = await request(app)
        .post('/login')
        .send({
          email_user: 'test@crda.com',
          password_user: 'correctpassword'
        });

      expect(response.statusCode).toBe(302); // Redirect
      expect(response.headers.location).toBe('/getservices');
      expect(mockConnection.query).toHaveBeenCalledWith(
        'SELECT * FROM utilisateur WHERE email_user = ?',
        ['test@crda.com']
      );
      expect(bcrypt.compare).toHaveBeenCalledWith('correctpassword', 'hashedPassword');
    });

    it('should redirect to unapproved page when account is not approved', async () => {
      // Mock user exists but not approved
      const mockUser = {
        id: 1,
        email_user: 'pending@crda.com',
        password_user: 'hashedPassword',
        role_user: 'chef_dentreprise',
        status_user: 'pending',
        nom_user: 'Pending',
        prenom_user: 'User'
      };
      
      mockConnection.query.mockResolvedValueOnce([[mockUser]]);
      bcrypt.compare.mockResolvedValueOnce(true);

      const response = await request(app)
        .post('/login')
        .send({
          email_user: 'pending@crda.com',
          password_user: 'correctpassword'
        });

      expect(response.statusCode).toBe(302); // Redirect
      expect(response.headers.location).toBe('/unapproved_login');
    });

    it('should handle database errors gracefully', async () => {
      // Simulate a DB error when querying for the user
      mockConnection.query.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .post('/login')
        .send({
          email_user: 'test@crda.com',
          password_user: 'anyPassword'
        });

      expect(response.statusCode).toBe(500); // Internal Server Error
      expect(response.text).toBe('Database error occurred');
    });

    it('should return 500 error when bcrypt comparison fails', async () => {
      // Simulate bcrypt failure
      bcrypt.compare.mockRejectedValueOnce(new Error('bcrypt error'));

      const response = await request(app)
        .post('/login')
        .send({
          email_user: 'test@crda.com',
          password_user: 'correctpassword'
        });

      expect(response.statusCode).toBe(500); // Internal Server Error
      expect(response.text).toBe('Password verification failed');
    });
  });
});
