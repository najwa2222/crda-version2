const js = require('@eslint/js');
const { node } = require('globals');

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...node,
        process: 'readonly',
        console: 'readonly'
      }
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off"
    },
    ignores: [
      "**/node_modules/",
      "coverage/",
      "public/",
      "**/*.config.js"
    ]
  }
];