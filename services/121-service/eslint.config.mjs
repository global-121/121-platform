import eslint from '@eslint/js';
import eslintPluginComments from 'eslint-plugin-eslint-comments';
import eslintPluginJest from 'eslint-plugin-jest';
import eslintPluginN from 'eslint-plugin-n';
import eslintPluginNoRelativePaths from 'eslint-plugin-no-relative-import-paths';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import eslintPluginPromise from 'eslint-plugin-promise';
import eslintPluginSimpleSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tsEslint from 'typescript-eslint';

// Import custom rules plugin
import customRulesPlugin from './eslint-plugin-custom-rules/index.js';

export default tsEslint.config(
  {
    ignores: ['dist/**', 'tmp/**', 'documentation/**', 'coverage/**'],
  },
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
      eslintPluginPrettierRecommended,
    ],
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022, // NOTE: Align with Node.js version from: `.node-version`-file
      sourceType: 'module',
    },
    name: 'JavaScript files (ESM)',
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
      eslintPluginPromise.configs['flat/recommended'],
      eslintPluginPrettierRecommended,
    ],
    files: ['**/*.ts'],
    name: 'TypeScript files',
    plugins: {
      'eslint-comments': eslintPluginComments,
      'no-relative-import-paths': eslintPluginNoRelativePaths,
      'simple-import-sort': eslintPluginSimpleSort,
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
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
      'n/no-extraneous-import': 'off', // Managed by TypeScript
      'n/no-missing-import': 'off', // Disabled to allow for path-aliases via tsconfig.json
      'n/no-process-env': 'error',
      'n/no-unsupported-features/node-builtins': [
        'error',
        {
          ignores: ['Headers'],
        },
      ],
      'n/prefer-node-protocol': 'error',
      'no-relative-import-paths/no-relative-import-paths': [
        'warn',
        {
          prefix: '@121-service',
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
      'no-restricted-syntax': [
        'error',
        {
          message:
            'Unsafe where condition, that can leak data. Use Equal() instead.',
          selector:
            "ObjectExpression > .properties[key.name='where'] > .value > .properties:not(:has(CallExpression)), ObjectExpression > .properties[key.name='where'] > .value > .properties > .value > .properties:not(:has(CallExpression))",
        },
        {
          message:
            'Unsafe where condition, that can leak data. Use Equal() instead.',
          selector:
            "ObjectExpression > .properties[key.name='andWhere'] > .value > .properties:not(:has(CallExpression)), ObjectExpression > .properties[key.name='where'] > .value > .properties > .value > .properties:not(:has(CallExpression))",
        },
      ],
      'object-shorthand': 'error',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      // 'promise/prefer-await-to-callbacks': 'warn', // TODO: Enable (locally only) to see if there is something to refactor.
      // 'promise/prefer-await-to-then': 'warn', // TODO: Enable (locally only) to see if there is something to refactor.
      'promise/no-callback-in-promise': 'error',
      'promise/no-multiple-resolved': 'error',
      'promise/no-nesting': 'error',
      'promise/no-promise-in-callback': 'error',
      'promise/no-return-in-finally': 'error',
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
            ['^@121-service'],
            // Relative imports.
            // Anything that starts with a dot.
            ['^\\.'],
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.entity.ts'],
    name: 'Entity files',
    plugins: {
      'custom-rules': customRulesPlugin,
    },
    rules: {
      'custom-rules/typeorm-cascade-ondelete': 'error',
    },
  },
  {
    files: ['**/*.controller.ts'],
    name: 'Controller files',
    plugins: {
      'custom-rules': customRulesPlugin,
    },
    rules: {
      'custom-rules/controller-authenticated-user': 'error',
      'custom-rules/no-method-api-tags': 'error',
    },
  },
  {
    extends: [eslintPluginJest.configs['flat/recommended']],
    files: ['**/*.spec.ts', '**/*.test.ts'],
    name: 'Test files',
  },
);
