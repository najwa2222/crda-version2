import { jest } from '@jest/globals';

const mockConnection = {
  query: jest.fn().mockResolvedValue([[{ '1': 1 }]]),
  end: jest.fn().mockResolvedValue(true)
};

// Named exports to match actual mysql2/promise structure
export const createConnection = jest.fn(() => Promise.resolve(mockConnection));
export const createPool = jest.fn();

// For compatibility with dynamic imports
export default { createConnection, createPool };