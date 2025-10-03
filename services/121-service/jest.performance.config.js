/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  rootDir: '.',
  testMatch: ['<rootDir>/test/performance/**/*.test.ts'],
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
  testTimeout: 600_000, // 10 minutes for performance tests
  randomize: true,
  verbose: true,
  reporters: ['default', ['github-actions', { silent: false }], 'summary'],
  // Performance tests should run sequentially to avoid resource conflicts
  maxWorkers: 1,
  // Setup file for performance test utilities
  setupFilesAfterEnv: ['<rootDir>/test/performance/jest.setup.ts'],
};
