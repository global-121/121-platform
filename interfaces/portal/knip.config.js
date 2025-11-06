/** @type {import('knip').KnipConfig} */
module.exports = {
  entry: [
    // Utility/script files:
    'src/environments/environment.ts.template.mjs',
  ],
  ignoreDependencies: [
    '@angular/platform-browser-dynamic', // Probably not 100% required
    'primeicons',
    // Known issues with devDependencies:
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
