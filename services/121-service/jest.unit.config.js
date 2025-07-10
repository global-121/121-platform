const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
});

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
  moduleFileExtensions: ['js', 'mjs', 'ts'],
  transform: {
    '^.+\\.ts?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
    'node_modules/@t3-oss/.+\\.js$': ['ts-jest'],
  },
  transformIgnorePatterns: ['node_modules/(?!@t3-oss)'],
  randomize: true,
  verbose: true,
  reporters: [
    'jest-ci-spec-reporter',
    ['github-actions', { silent: false }],
    'summary',
  ],
};
