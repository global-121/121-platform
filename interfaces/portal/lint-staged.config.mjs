import baseConfig from '../../.lintstagedrc.js';

export default {
  ...baseConfig,
  '*.{html,ts}': () => 'npm run extract-i18n:smart', // Needs to run the whole project, not just the staged/changed files
  '*.{ts,js,html}': 'eslint --fix',
};
