/**
 * @type {import('@jest/types').Config.InitialOptions}
 */
module.exports = {
  moduleFileExtensions: ['js', 'ts'],
  transform: {
    '^.+\\.ts?$': ['ts-jest', { tsconfig: '<rootDir>/test/tsconfig.json' }],
  },
  rootDir: '.',
  testMatch: ['<rootDir>/test/**/*.test.ts'],
  coverageReporters: ['json', 'lcov'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  testTimeout: 30_000,
  randomize: false, // TODO: Some tests still depend on the order, but should not. Toggle locally to test + fix.
  verbose: true,
  reporters: [
    'jest-ci-spec-reporter',
    ['github-actions', { silent: false }],
    'summary',
  ],
};
