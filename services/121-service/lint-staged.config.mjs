import baseConfig from '../../lint-staged.config.mjs';

// See: https://github.com/lint-staged/lint-staged#using-js-configuration-files
export default {
  ...baseConfig,
  '*.ts': () => 'npm run typecheck', // Needs to run the whole project, not just the staged/changed files
  '*.{ts,js,mjs}': 'eslint --fix',
};
