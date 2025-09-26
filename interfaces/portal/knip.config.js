/** @type {import('knip').KnipConfig} */
module.exports = {
  entry: [
    // Utility/script test-files:
    '_env.utils.spec.ts',
    '_matomo.utils.spec.ts',
  ],
  ignoreDependencies: [
    '@angular/platform-browser-dynamic', // Probably not 100% required
    'primeicons',
    // Known isues with devDependencies:
    'autoprefixer',
    // Known issues with Unlisted dependencies:
    '@angular-eslint/builder',
    '@angular-devkit/build-angular',
  ],
  includeEntryExports: true,
  project: ['src/**/*.ts', '**/_*.{mjs,js,ts}'],
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
