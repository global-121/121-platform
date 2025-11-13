// See: https://github.com/lint-staged/lint-staged#using-js-configuration-files
module.exports = {
  '*.{md,json,yml,scss}': 'prettier --write',
};
