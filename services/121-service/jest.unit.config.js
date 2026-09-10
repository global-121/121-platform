/** @type {import('ts-jest').JestConfigWithTsJest} */
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
    'node_modules/(@t3-oss|uuid|openid-client|oauth4webapi|jose|sanitize-html|htmlparser2|entities|domhandler|domutils|domelementtype|dom-serializer)/.+[.]js$':
      ['ts-jest', { useESM: true }],
    '^.+\\.tsx?$': ['ts-jest', {}],
  },
  transformIgnorePatterns: [
    'node_modules/(?!@t3-oss|uuid|openid-client|oauth4webapi|jose|sanitize-html|htmlparser2|entities|domhandler|domutils|domelementtype|dom-serializer)',
  ],
  detectOpenHandles: true,
  errorOnDeprecated: true,
  logHeapUsage: true,
  randomize: true,
  verbose: true,
  reporters: [
    'jest-ci-spec-reporter',
    ['github-actions', { silent: false }],
    'summary',
  ],
};
