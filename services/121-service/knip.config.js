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
    'eslint-config-121-platform', // Shared config, used in eslint.config.mjs
    'prettier', // Used by VSCode and ESLint via shared config
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
