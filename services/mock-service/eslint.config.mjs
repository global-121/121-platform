import { defineConfig, globalIgnores } from 'eslint/config';
import eslintConfig121Platform from 'eslint-config-121-platform';
import eslintPluginNoRelativePaths from 'eslint-plugin-no-relative-import-paths';
import eslintPluginRegexp from 'eslint-plugin-regexp';
import tsEslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores(['dist/**', 'tmp/**', 'coverage/**']),
  eslintConfig121Platform.configs.base,
  eslintConfig121Platform.configs.recommended,
  eslintConfig121Platform.configs.recommendedNext,
  eslintConfig121Platform.configs.node,
  eslintConfig121Platform.configs.javascript,
  {
    name: 'JavaScript files (ESM)',
    files: ['**/*.js', '**/*.mjs'],
    extends: [eslintPluginRegexp.configs['flat/recommended']],
  },
  eslintConfig121Platform.configs.services,
  eslintConfig121Platform.configs.typescript, // Needs to be AFTER `*.configs.node`; It needs to override some rules!
  eslintConfig121Platform.configs.typescriptNext,
  {
    name: 'TypeScript files',
    files: ['**/*.ts'],
    extends: [
      tsEslint.configs.recommended,
      tsEslint.configs.stylistic,
      eslintPluginRegexp.configs['flat/recommended'],
    ],
    plugins: {
      'no-relative-import-paths': eslintPluginNoRelativePaths,
      regexp: eslintPluginRegexp,
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
      '@typescript-eslint/no-parameter-properties': 'off',
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
    },
  },
);
