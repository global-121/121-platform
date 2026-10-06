import { defineConfig } from 'jest';

// eslint-disable-next-line n/no-process-env -- Allow for opt-in per-run; Not by default on all(CI) runs.
const DEBUG = !!process.env.DEBUG;

export default defineConfig({
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
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!@t3-oss|uuid|openid-client|oauth4webapi|jose|sanitize-html|htmlparser2|entities|domhandler|domutils|domelementtype|dom-serializer)',
  ],
  testTimeout: 30_000,
  detectOpenHandles: DEBUG,
  errorOnDeprecated: true,
  logHeapUsage: DEBUG,
  randomize: true,
  verbose: true,
  reporters: ['default', ['github-actions', { silent: false }], 'summary'],
  testEnvironmentOptions: {
    globalsCleanup: 'on',
  },
});
