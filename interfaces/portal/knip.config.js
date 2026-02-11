/** @type {import('knip').KnipConfig} */
module.exports = {
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
  project: [
    'src/**/*.ts', // All Angular app/source files
    '**/_*.{mjs,js,ts}', // All non-Angular utility scripts
    'src/environments/environment.ts.template.mjs', // Specific workaround-file for ENV-variable loading
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
