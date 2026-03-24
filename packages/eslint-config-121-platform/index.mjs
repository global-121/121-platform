import { defineConfig } from 'eslint/config';
import eslint from '@eslint/js';
import eslintPluginComments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import eslintPluginN from 'eslint-plugin-n';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

/**
 * Shared ESLint configuration for all packages of the 121-platform.
 *
 * A few 'building blocks' are provided, which should be composed into a specific eslint.config.mjs-file for each package, depending on the environment/needs.
 *
 * @example - For a back-end service:
 * ```ts
 * import eslintConfig121Platform from 'eslint-config-121-platform';
 * export default defineConfig({
 *   extends: [
 *     eslintConfig121Platform.configs.base,
 *     eslintConfig121Platform.configs.node,
 *     eslintConfig121Platform.configs.typescript,
 *   ],
 * });
 * ```
 *
 * @example - For a (native, node, JS) CLI-script:
 * ```ts
 * import eslintConfig121Platform from 'eslint-config-121-platform';
 * export default defineConfig({
 *   extends: [
 *     eslintConfig121Platform.configs.base,
 *     eslintConfig121Platform.configs.node,
 *     eslintConfig121Platform.configs.javascript,
 *   ],
 * });
 * ```
 *
 * @type {import('./index.d.ts').EslintConfig121Platform} */
export default {
  configs: {
    base: defineConfig({
      name: '121-platform/base',
      languageOptions: {
        parserOptions: {
          projectService: true,
          tsconfigRootDir: import.meta.dirname,
        },
      },
      linterOptions: {
        reportUnusedInlineConfigs: 'error',
        reportUnusedDisableDirectives: 'error',
      },
      extends: [eslint.configs.recommended, eslintPluginComments.recommended],
      rules: {
        '@eslint-community/eslint-comments/require-description': 'error',
      },
    }),
    legacyNode: defineConfig({
      name: '121-platform/legacy-node',
      languageOptions: {
        globals: globals.node,
      },
    }),
    browser: defineConfig({
      name: '121-platform/browser',
      languageOptions: {
        globals: globals.browser,
      },
    }),
    node: defineConfig({
      name: '121-platform/node',
      files: ['**/*.mjs', '**/*.ts'],
      languageOptions: {
        globals: globals.nodeBuiltin,
      },
      plugins: {
        n: eslintPluginN,
      },
      extends: [eslintPluginN.configs['flat/recommended-module']],
      rules: {
        'n/prefer-node-protocol': 'error',
        'n/no-path-concat': 'error',
      },
    }),
    recommended: defineConfig({
      name: '121-platform/recommended',
      files: ['**/*.mjs', '**/*.ts'],
      languageOptions: {
        ecmaVersion: 2022, // NOTE: Align with Node.js version from: `.node-version`-file
        sourceType: 'module',
        globals: globals.nodeBuiltin,
      },
      rules: {
        'object-shorthand': 'error',
        'prefer-arrow-callback': 'error',
        'no-inner-declarations': 'error',
      },
    }),
    recommendedNext: defineConfig({
      name: '121-platform/recommended-next',
      files: ['**/*.mjs', '**/*.ts'],
      rules: {
        'arrow-body-style': 'error',
        'func-style': 'error',
      },
    }),
    javascript: defineConfig({
      name: '121-platform/javascript',
      files: ['**/*.mjs'],
    }),
    typescript: defineConfig({
      name: '121-platform/typescript',
      files: ['**/*.ts'],
      plugins: {
        n: eslintPluginN,
      },
      rules: {
        'n/no-extraneous-import': 'off', // Managed by TypeScript
        'n/no-missing-import': 'off', // Disabled to allow for path-aliases via tsconfig.json
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
      },
    }),
    services: defineConfig({
      name: '121-platform/services',
      plugins: {
        n: eslintPluginN,
      },
      rules: {
        'n/no-process-env': 'error',
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
    }),
    final: defineConfig({
      name: '121-platform/final',
      files: ['**/*.js', '**/*.mjs', '**/*.ts', 'src/app/**/*.html'],
      extends: [eslintPluginPrettierRecommended],
    }),
  },
};
