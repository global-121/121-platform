/** @type {import('knip').KnipConfig} */
module.exports = {
  project: ['src/**/*.ts', '!src/migration/*.ts'],
  rules: {
    binaries: 'warn',
    dependencies: 'warn',
    devDependencies: 'warn',
    enumMembers: 'warn',
    types: 'warn',
    unlisted: 'warn',
  },

  // Plugin-specific:
  jest: {
    config: 'jest.{integration,unit}.config.js',
  },
};
