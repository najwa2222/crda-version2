// jest.config.js
export default {
  testEnvironment: 'node',
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['lcov', 'text', 'text-summary'],
  collectCoverageFrom: [
    'app.js',
    '!**/node_modules/**',
    '!**/vendor/**',
    '!**/coverage/**',
  ],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  // Transform ES modules with Babel
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  // Ensure Jest knows how to map mysql2/promise
  moduleNameMapper: {
    '^mysql2/promise$': '<rootDir>/__mocks__/mysql2/promise.js',
  },
};
