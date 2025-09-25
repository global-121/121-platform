/** @type {import('knip').KnipConfig} */
module.exports = {
  project: [
    'src/**/*.ts',
    '!src/migration/*.ts', // Migrations don't have an 'entry point'
  ],
  includeEntryExports: true,
  ignoreBinaries: [
    'open', // Default available on macOS
  ],
  ignoreDependencies: [
    // Known issues with devDependencies:
    '@automock/adapters.nestjs', // Auto-loaded by @automock/jest
    '@compodoc/compodoc', // Only used 'manually', see README.md
  ],
  rules: {
    binaries: 'error',
    dependencies: 'error',
    devDependencies: 'error',
    exports: 'error',
    enumMembers: 'error',
    types: 'error',
    unlisted: 'error',
  },

  // Plugin-specific:
  jest: {
    config: 'jest.{integration,unit}.config.js',
  },
};
