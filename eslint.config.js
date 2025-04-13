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
        setTimeout: 'readonly',
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
        module: 'readonly',  // ✅ Make module available for config files
        require: 'readonly',
        jest: 'readonly',
        describe: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        it: 'readonly',
        expect: 'readonly',
      },
    },
    files: ['**/__tests__/**/*.js', '**/*.test.js', '**/jest/**/*.js', 'jest-junit.config.js'], // ✅ Explicitly include the jest-junit config file
    plugins: {
      jest: eslintPluginJest,
    },
    rules: {
      // Add any Jest rules here if needed
    },
  },
  {
    languageOptions: {
      globals: {
        jest: 'readonly',
      },
    },
    files: ['**/__mocks__/**/*.js'],
    rules: {
      'no-undef': 'off',
    },
  },
];
