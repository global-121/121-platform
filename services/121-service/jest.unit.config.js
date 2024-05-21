/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  rootDir: '.',
  testMatch: ['<rootDir>/**/*.spec.ts'],
  coverageReporters: ['json', 'lcov'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  moduleNameMapper: {
    '^@121-service/(.*)$': '<rootDir>/$1',
  },
  randomize: true,
  verbose: true,
  reporters: [
    'jest-ci-spec-reporter',
    ['github-actions', { silent: false }],
    'summary',
  ],
};
