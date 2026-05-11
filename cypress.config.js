'use strict';

const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://127.0.0.1:5173',
    specPattern: 'cypress/integration/**/*.spec.js',
    supportFile: false,
    video: false,
    env: {
      apiBaseUrl: 'http://127.0.0.1:3000',
    },
  },
});
