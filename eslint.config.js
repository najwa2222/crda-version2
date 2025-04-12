import js from '@eslint/js';
import eslintPluginJest from 'eslint-plugin-jest';

export default [
  // ESLint recommended rules
  js.configs.recommended,

  {
    files: ['**/*.js'],
    languageOptions: {
      globals: {
        node: 'readonly',
        process: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly', // Add setTimeout here if you want to allow it
      },
    },
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
    files: ['**/__tests__/**/*.js', '**/*.test.js'],
    languageOptions: {
      globals: {
        jest: 'readonly', // Allow Jest globals
        describe: 'readonly',
        beforeEach: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly', // Explicitly add beforeAll to avoid the error
      },
    },
    plugins: {
      jest: eslintPluginJest,
    },
    rules: {
      // Jest-specific rules can be added here if necessary
    },
  },
];
