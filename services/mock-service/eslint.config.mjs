import eslint from '@eslint/js';
import eslintPluginComments from 'eslint-plugin-eslint-comments';
import eslintPluginN from 'eslint-plugin-n';
import eslintPluginNoRelativePaths from 'eslint-plugin-no-relative-import-paths';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import eslintPluginRegexp from 'eslint-plugin-regexp';
import eslintPluginSimpleSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tsEslint from 'typescript-eslint';

export default tsEslint.config(
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    name: 'Root config',
  },
  {
    extends: [
      eslint.configs.recommended,
      eslintPluginN.configs['flat/recommended'],
      eslintPluginRegexp.configs['flat/recommended'],
      eslintPluginPrettierRecommended,
    ],
    files: ['**/*.js', '**/*.mjs'],
    name: 'JavaScript files (ESM)',
    languageOptions: {
      ecmaVersion: 2022, // NOTE: Align with Node.js version from: `.node-version`-file
      sourceType: 'module',
    },
    plugins: {
      'eslint-comments': eslintPluginComments,
    },
    rules: {
      'eslint-comments/no-unused-disable': 'error',
      'eslint-comments/require-description': 'error',
    },
  },
  {
    name: 'JavaScript files (old, pre-ESM)',
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'script',
    },
  },
  {
    extends: [
      ...tsEslint.configs.recommended,
      ...tsEslint.configs.stylistic,
      eslintPluginN.configs['flat/recommended'],
      eslintPluginRegexp.configs['flat/recommended'],
      eslintPluginPrettierRecommended,
    ],
    files: ['**/*.ts'],
    name: 'TypeScript files',
    plugins: {
      'eslint-comments': eslintPluginComments,
      'no-relative-import-paths': eslintPluginNoRelativePaths,
      regexp: eslintPluginRegexp,
      'simple-import-sort': eslintPluginSimpleSort,
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
        },
      ],
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-parameter-properties': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrors: 'none',
          varsIgnorePattern: '^_',
        },
      ],
      'eslint-comments/no-unused-disable': 'error',
      'eslint-comments/require-description': 'error',
      'n/no-extraneous-import': 'off', // Managed by TS
      'n/no-missing-import': 'off', // Disabled to allow for path-aliases via tsconfig.json
      'n/no-process-env': 'error',
      'n/prefer-node-protocol': 'error',
      'no-relative-import-paths/no-relative-import-paths': [
        'warn',
        {
          prefix: '@mock-service',
          rootDir: '.',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['process', 'node:process'],
              importNames: ['env'],
              message: 'Import ENV-variables from env.ts only.',
            },
          ],
        },
      ],
      'object-shorthand': 'error',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      'simple-import-sort/exports': 'error',
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // Packages.
            // Things that start with a letter (or digit or underscore), or `@` followed by a letter.
            ['^@?\\w'],
            // Alias imports
            ['^@mock-service'],
            // Relative imports.
            // Anything that starts with a dot.
            ['^\\.'],
          ],
        },
      ],
    },
  },
);
