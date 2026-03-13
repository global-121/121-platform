import { defineConfig, globalIgnores } from 'eslint/config';
import eslintPluginPromise from 'eslint-plugin-promise';
import eslintPluginSimpleSort from 'eslint-plugin-simple-import-sort';
import tsEslint from 'typescript-eslint';
import eslintConfig121Platform from 'eslint-config-121-platform';

export default defineConfig(
  globalIgnores(['test-results/**', 'playwright-report/**']),
  eslintConfig121Platform.configs.base,
  eslintConfig121Platform.configs.node,
  eslintConfig121Platform.configs.javascript,
  eslintConfig121Platform.configs.typescript,
  eslintConfig121Platform.configs.services,
  {
    name: 'TypeScript files',
    files: ['**/*.ts'],
    extends: [
      ...tsEslint.configs.recommended,
      ...tsEslint.configs.stylisticTypeChecked,
      eslintPluginPromise.configs['flat/recommended'],
    ],
    plugins: {
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
  eslintConfig121Platform.configs.final, // NOTE: This needs to be last! It configures Prettier, to make sure auto-formatting works.
);
