// See: https://github.com/lint-staged/lint-staged#using-js-configuration-files

export const prettierOnly = {
  '*.{md,json,yml,scss,css}': 'prettier --write',
};

export default {
  '*.ts': () => 'npm run typecheck', // Needs to run the whole project, not just the staged/changed files
  '*.{ts,js,mjs}': 'eslint --fix --cache',
  ...prettierOnly,
};
