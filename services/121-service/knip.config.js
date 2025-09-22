/** @type {import('knip').KnipConfig} */
module.exports = {
  project: [
    'src/**/*.ts',
    '!src/migration/*.ts', // Migrations don't have an 'entry point'
  ],
  includeEntryExports: true,
  rules: {
    binaries: 'warn', // Known issues: open (default available on macOS)
    dependencies: 'error',
    devDependencies: 'warn', // Known isues: @automock/adapters.nestjs, compodoc
    exports: 'error',
    enumMembers: 'error',
    types: 'error',
    unlisted: 'warn',
  },

  // Plugin-specific:
  jest: {
    config: 'jest.{integration,unit}.config.js',
  },
};
