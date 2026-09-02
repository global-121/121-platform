/** @type {import('jest').Config} */
const { typescriptOptions, esmNodeModuleOptions } =
  require('./swc-jest-options').default;

module.exports = {
  rootDir: '.',
  testMatch: ['<rootDir>/test/**/*.test.ts'],
  setupFilesAfterEnv: ['jest-extended/all'],
  coverageReporters: ['json', 'lcov'],
  collectCoverageFrom: ['src/**/*.ts', '!src/migration/**'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  moduleNameMapper: {
    '^@121-service/(.*)$': '<rootDir>/$1',
  },
  moduleFileExtensions: ['js', 'ts'],
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
  testTimeout: 30_000,
  randomize: true,
  verbose: true,
  reporters: ['default', ['github-actions', { silent: false }], 'summary'],
  testEnvironmentOptions: {
    globalsCleanup: 'on',
  },
};
