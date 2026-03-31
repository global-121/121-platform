import baseConfig from '../../packages/lint-staged.config.base.mjs';

// See: https://github.com/lint-staged/lint-staged#using-js-configuration-files
export default {
  ...baseConfig,
  '*.html': 'eslint --fix --cache',
  '*.{html,ts}': () => 'npm run extract-i18n:smart', // Needs to run the whole project, not just the staged/changed files
};
