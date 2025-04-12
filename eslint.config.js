import js from '@eslint/js';
import eslintPluginJest from 'eslint-plugin-jest';

export default [
  // ESLint recommended rules
  js.configs.recommended,

  {
    languageOptions: {
      globals: {
        node: 'readonly',
        process: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly', // Allow setTimeout
      },
    },
    files: ['**/*.js'],
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
    },
    ignores: [
      '**/node_modules/',
      'coverage/',
      'public/',
      '**/*.config.js',
    ],
  },
  {
    languageOptions: {
      globals: {
        jest: 'readonly', // Allow Jest globals
        describe: 'readonly',
        beforeEach: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
      },
    },
    files: ['**/__tests__/**/*.js', '**/*.test.js'],
    plugins: {
      jest: eslintPluginJest,
    },
    rules: {
      // Jest-specific rules can be added here if necessary
    },
  },
  {
    languageOptions: {
      globals: {
        jest: 'readonly', // Allow Jest globals in mock files
      },
    },
    files: ['**/__mocks__/**/*.js'], // Add specific rule for mock files
    rules: {
      'no-undef': 'off', // Disable "no-undef" for mock files
    },
  },
];
