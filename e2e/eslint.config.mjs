import eslint from '@eslint/js';
import eslintPluginComments from 'eslint-plugin-eslint-comments';
import eslintPluginN from 'eslint-plugin-n';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import eslintPluginPromise from 'eslint-plugin-promise';
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
    name: 'JavaScript (config) files',
    extends: [
      eslint.configs.recommended,
      eslintPluginN.configs['flat/recommended'],
      eslintPluginPrettierRecommended,
    ],
    files: ['**/*.mjs'],
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
    name: 'TypeScript files',
    extends: [
      ...tsEslint.configs.recommended,
      ...tsEslint.configs.stylisticTypeChecked,
      eslintPluginN.configs['flat/recommended'],
      eslintPluginPromise.configs['flat/recommended'],
      eslintPluginPrettierRecommended,
    ],
    files: ['**/*.ts'],
    plugins: {
      'eslint-comments': eslintPluginComments,
      'simple-import-sort': eslintPluginSimpleSort,
    },
    rules: {
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
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
      'n/no-extraneous-import': 'off', // Managed by TypeScript
      'n/no-missing-import': 'off', // Disabled to allow for path-aliases via tsconfig.json
      'n/no-process-env': 'error',
      'n/prefer-node-protocol': 'error',
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
      'promise/no-callback-in-promise': 'error',
      'promise/no-multiple-resolved': 'error',
      'promise/no-nesting': 'error',
      'promise/no-promise-in-callback': 'error',
      'promise/no-return-in-finally': 'error',
      'promise/prefer-await-to-callbacks': 'error',
      'promise/prefer-await-to-then': 'error',
      'promise/valid-params': 'error',
      'simple-import-sort/exports': 'error',
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // Packages.
            // Things that start with a letter (or digit or underscore), or `@` followed by a letter.
            ['^@?\\w'],
            // Alias imports
            ['^@121-portal', '^@121-service'],
            // Local imports
            ['^@121-e2e'],
            // Relative imports.
            // Anything that starts with a dot.
            ['^\\.'],
          ],
        },
      ],
    },
  },
);
