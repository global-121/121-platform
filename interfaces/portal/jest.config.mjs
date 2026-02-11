export default {
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/app/test-utils.ts',
  ],
  coverageReporters: ['json', 'lcov', 'text-summary'],
  moduleFileExtensions: ['ts', 'js', 'mjs', 'html'],
  moduleNameMapper: {
    '^(_.*)\\.mjs$': '<rootDir>/$1.mjs',
    '^@121-service/(.*)$': '<rootDir>/../../services/121-service/$1',
    '^tailwind.config$': '<rootDir>/tailwind.config',
    '^~/(.*)$': '<rootDir>/src/app/$1',
    '^~environment$': '<rootDir>/src/environments/environment',
  },
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        stringifyContentPathRegex: '\\.html$',
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
};
