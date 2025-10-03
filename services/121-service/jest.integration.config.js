/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  rootDir: '.',
  testMatch: ['<rootDir>/test/**/*.test.ts'],
  // Exclude performance tests by default unless running in cronjob
  testPathIgnorePatterns: process.env.RUNNING_IN_CRONJOB === 'true' ? [] : ['<rootDir>/test/performance/'],
  coverageReporters: ['json', 'lcov'],
  collectCoverageFrom: ['src/**/*.ts', '!src/migration/**'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  moduleNameMapper: {
    '^@121-service/(.*)$': '<rootDir>/$1',
  },
  moduleFileExtensions: ['js', 'ts'],
  transform: {
    '^.+\\.ts?$': ['ts-jest', { tsconfig: '<rootDir>/test/tsconfig.json' }],
    'node_modules/@t3-oss/.+\\.js$': ['ts-jest'],
  },
  transformIgnorePatterns: ['node_modules/(?!@t3-oss)'],
  testTimeout: 30_000,
  randomize: true,
  verbose: true,
  reporters: ['default', ['github-actions', { silent: false }], 'summary'],
};
