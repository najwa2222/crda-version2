// @ts-nocheck
const js = require('@eslint/js');
const { node, jest } = require('globals');
const eslintPluginJest = require('eslint-plugin-jest');

module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: {
        ...node,
        process: 'readonly',
        console: 'readonly',
      }
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off'
    },
    ignores: [
      '**/node_modules/',
      'coverage/',
      'public/',
      '**/*.config.js'
    },
  },
  {
    files: ['**/__tests__/**/*.js', '**/*.test.js'],
    languageOptions: {
      globals: {
        ...jest
      }
    },
    plugins: {
      jest: eslintPluginJest
    },
    rules: {
      // Jest-specific rules can go here
    }
  }
];
