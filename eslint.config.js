// eslint.config.js
import js from '@eslint/js';
import pkg from 'globals';  // Import the entire globals package
const { node, jest } = pkg;  // Destructure node and jest from the package
import eslintPluginJest from 'eslint-plugin-jest';

export default [
  // Include the recommended ESLint rules directly in the config array
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
    ],
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
