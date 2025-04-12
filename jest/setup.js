// jest/setup.js
import { jest } from '@jest/globals';

// Store original environment
const originalEnv = { ...process.env };

beforeAll(() => {
  // Modify environment safely
  Object.assign(process.env, {
    NODE_ENV: 'test',
    MYSQL_HOST: 'localhost',
    MYSQL_USER: 'test',
    MYSQL_PASSWORD: 'test',
    MYSQL_DATABASE: 'test_db',
    SESSION_SECRET: 'test-secret'
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  // Restore environment properly
  process.env = originalEnv;
});