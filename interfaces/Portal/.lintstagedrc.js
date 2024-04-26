const baseConfig = require('../../.lintstagedrc.js');

module.exports = {
  ...baseConfig,
  '*.{ts,js,html}': ['eslint --fix'],
};
