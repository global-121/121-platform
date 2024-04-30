const baseConfig = require('../../.lintstagedrc.js');

module.exports = {
  ...baseConfig,
  '*.{ts,js}': ['eslint --fix'],
};
