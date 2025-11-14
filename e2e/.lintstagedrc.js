const baseConfig = require('../.lintstagedrc.js');

// See: https://github.com/lint-staged/lint-staged#using-js-configuration-files
module.exports = {
  ...baseConfig,
  '*.{ts,js}': 'eslint --fix',
};
