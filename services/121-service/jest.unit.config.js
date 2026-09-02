/** @type {import('jest').Config} */
const { typescriptOptions, esmNodeModuleOptions } =
  require('./swc-jest-options').default;

module.exports = {
  rootDir: '.',
  testMatch: ['<rootDir>/**/*.spec.ts'],
  setupFilesAfterEnv: [
    'jest-extended/all',
    '<rootDir>/src/utils/test-helpers/matchers/httpExceptionMatcher.ts',
  ],
  coverageReporters: ['json', 'lcov'],
  collectCoverageFrom: ['src/**/*.ts', '!src/migration/**'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  moduleNameMapper: {
    '^@121-service/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.ts$': ['@swc/jest', typescriptOptions],
    'node_modules/(@t3-oss|uuid|openid-client|oauth4webapi|jose)/.+[.]js$': [
      '@swc/jest',
      esmNodeModuleOptions,
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!@t3-oss|uuid|openid-client|oauth4webapi|jose)',
  ],
  randomize: true,
  verbose: true,
  reporters: [
    'jest-ci-spec-reporter',
    ['github-actions', { silent: false }],
    'summary',
  ],
};
