import { defineConfig, globalIgnores } from 'eslint/config';
import eslintConfig121Platform from 'eslint-config-121-platform';
import eslintPluginJest from 'eslint-plugin-jest';
import eslintPluginNoRelativePaths from 'eslint-plugin-no-relative-import-paths';
import eslintPluginPromise from 'eslint-plugin-promise';
import eslintPluginSimpleSort from 'eslint-plugin-simple-import-sort';
import tsEslint from 'typescript-eslint';

import controllerAuthenticatedUser from './eslint-custom-rules/controller-authenticated-user.mjs';
import noMethodApiTags from './eslint-custom-rules/no-method-api-tags.mjs';
import typeormCascadeOndelete from './eslint-custom-rules/typeorm-cascade-ondelete.mjs';

/** @type {import('eslint').ESLint.Plugin} */
const customRulesPlugin = {
  rules: {
    'typeorm-cascade-ondelete': typeormCascadeOndelete,
    'no-method-api-tags': noMethodApiTags,
    'controller-authenticated-user': controllerAuthenticatedUser,
  },
};

export default defineConfig(
  globalIgnores([
    'dist/**',
    'tmp/**',
    '.nyc_output/**',
    'documentation/**',
    'coverage/**',
  ]),
  eslintConfig121Platform.configs.base,
  eslintConfig121Platform.configs.recommended,
  eslintConfig121Platform.configs.node,
  eslintConfig121Platform.configs.javascript,
  {
    name: 'Specific Config file exceptions ONLY',
    files: ['*.config.js'],
    // These exceptions should be minimal, until all these config-files can be converted to be ESM.
    extends: [eslintConfig121Platform.configs.legacyNode],
  },
  {
    name: 'Nest.js entry point (CommonJS) file',
    files: ['index.js'],
    // This file is the entry point for the service, and needs to be CommonJS for now, to be able to load ts-node/register.
    extends: [eslintConfig121Platform.configs.legacyNode],
  },
  eslintConfig121Platform.configs.services,
  eslintConfig121Platform.configs.typescript, // Needs to be AFTER `*.configs.node`; It needs to override some rules!
  {
    name: 'TypeScript files',
    files: ['**/*.ts'],
    extends: [
      tsEslint.configs.recommended,
      tsEslint.configs.stylistic,
      eslintPluginPromise.configs['flat/recommended'],
    ],
    plugins: {
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
      'n/no-unsupported-features/node-builtins': [
        'error',
        {
          ignores: ['Headers'],
        },
      ],
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
    name: 'Entity files',
    files: ['**/*.entity.ts'],
    plugins: {
      'custom-rules': customRulesPlugin,
    },
    rules: {
      'custom-rules/typeorm-cascade-ondelete': 'error',
    },
  },
  {
    name: 'Controller files',
    files: ['**/*.controller.ts'],
    plugins: {
      'custom-rules': customRulesPlugin,
    },
    rules: {
      'custom-rules/controller-authenticated-user': 'error',
      'custom-rules/no-method-api-tags': 'error',
    },
  },
  {
    name: 'Test files',
    files: ['**/*.spec.ts', '**/*.test.ts'],
    extends: [eslintPluginJest.configs['flat/recommended']],
  },
);
