import baseConfig from '../../.lintstagedrc.js';

// See: https://github.com/lint-staged/lint-staged#using-js-configuration-files
export default {
  ...baseConfig,
  '*.ts': () => 'npm run typecheck', // Needs to run the whole project, not just the staged/changed files
  '*.{html,ts}': () => 'npm run extract-i18n:smart', // Needs to run the whole project, not just the staged/changed files
  '*.{ts,js,html}': 'eslint --fix',
};
