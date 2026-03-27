import baseConfig from '../lint-staged.config.base.mjs';

// See: https://github.com/lint-staged/lint-staged#using-js-configuration-files
export default {
  ...baseConfig,
  '*.{ts,mjs}': 'eslint --fix',
};
