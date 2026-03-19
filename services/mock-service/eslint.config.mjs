import { defineConfig, globalIgnores } from 'eslint/config';
import eslintConfig121Platform from 'eslint-config-121-platform';
import eslintPluginNoRelativePaths from 'eslint-plugin-no-relative-import-paths';
import eslintPluginRegexp from 'eslint-plugin-regexp';
import eslintPluginSimpleSort from 'eslint-plugin-simple-import-sort';
import tsEslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores(['dist/**', 'tmp/**', 'coverage/**']),
  eslintConfig121Platform.configs.base,
  eslintConfig121Platform.configs.recommended,
  eslintConfig121Platform.configs.recommendedNext,
  eslintConfig121Platform.configs.node,
  eslintConfig121Platform.configs.javascript,
  eslintConfig121Platform.configs.typescript, // Needs to be AFTER `*.configs.node`; It needs to override some rules!
  eslintConfig121Platform.configs.services,
  {
    name: 'JavaScript files (ESM)',
    files: ['**/*.js', '**/*.mjs'],
    extends: [eslintPluginRegexp.configs['flat/recommended']],
  },
  {
    name: 'TypeScript files',
    files: ['**/*.ts'],
    extends: [
      ...tsEslint.configs.recommended,
      ...tsEslint.configs.stylistic,
      eslintPluginRegexp.configs['flat/recommended'],
    ],
    plugins: {
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
