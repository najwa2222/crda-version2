// eslint-disable-next-line no-unused-vars
import jestJunit from 'jest-junit';

export default {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^mysql2/promise$': '<rootDir>/__mocks__/mysql2/promise.js',
    '^express-mysql-session$': '<rootDir>/__mocks__/express-mysql-session.js',
  },
  setupFilesAfterEnv: ['<rootDir>/jest/setup.js'],
  testMatch: ['**/__tests__/**/*.test.js'],
  resolver: '<rootDir>/jest-resolver.js',
  transform: {},
  testTimeout: 30000,
  clearMocks: true,
  resetMocks: true,
  detectOpenHandles: true,
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './reports',  // This ensures output goes to results
      outputName: 'junit.xml',  // This specifies the file name
    }],
  ],
};
