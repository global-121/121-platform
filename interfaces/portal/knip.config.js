/** @type {import('knip').KnipConfig} */
module.exports = {
  ignoreDependencies: [
    // Known issues with "Unused dependencies":
    '@angular/platform-browser-dynamic', // Probably not 100% required
    'primeicons',
    // Known issues with "Unused devDependencies":
    'autoprefixer',
    // Known issues with "Unlisted dependencies":
    '@angular-eslint/builder',
  ],
  ignoreFiles: [
    'lint-staged.config.mjs', // Exception for 'global' lint-staged use
  ],
  includeEntryExports: true,
  entry: [
    'src/logout/logout.js', // Specific "manual override"/escape-hatch to log-out
  ],
  project: [
    '**/*.{mjs,js,ts}', // All is in-scope to check
  ],
  rules: {
    binaries: 'error',
    dependencies: 'error',
    devDependencies: 'error',
    enumMembers: 'error',
    exports: 'error',
    types: 'error',
    unlisted: 'error',
  },

  // Plugin-specific:
  typescript: {
    config: ['tsconfig.json', 'tsconfig.app.json', 'tsconfig.spec.json'],
  },
};
