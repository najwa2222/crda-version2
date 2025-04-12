import mysql from 'mysql2/promise';

// Mock MySQL connection
jest.mock('mysql2/promise', () => {
  const mockConnection = {
    query: jest.fn(),
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    threadId: 123
  };
  
  return {
    createConnection: jest.fn().mockResolvedValue(mockConnection)
  };
});

// Mock express-mysql-session
jest.mock('express-mysql-session', () => {
  return function() {
    return function() {
      return {
        // Mock session store methods
        get: jest.fn(),
        set: jest.fn(),
        destroy: jest.fn()
      };
    };
  };
});

// Mock express-session
jest.mock('express-session', () => {
  return jest.fn().mockImplementation(() => {
    return (req, res, next) => {
      req.session = {
        id: 'test-session-id',
        save: (callback) => callback && callback()
      };
      next();
    };
  });
});

// Mock environment variables
process.env.SESSION_SECRET = 'test-secret';
process.env.MYSQL_HOST = 'localhost';
process.env.MYSQL_USER = 'test';
process.env.MYSQL_PASSWORD = 'test';
process.env.MYSQL_DATABASE = 'test_db';