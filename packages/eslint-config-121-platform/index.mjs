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
 * @type {import('eslint-config-121-platform').EslintConfig121Platform} */
export default {
  configs: {
    base: {
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
    },
    node: {
      name: '121-platform/node',
      languageOptions: {
        globals: globals.node,
      },
      extends: [eslintPluginN.configs['flat/recommended-module']],
      rules: {
        'n/prefer-node-protocol': 'error',
        'n/no-path-concat': 'error',
      },
    },
    commonjs: {
      name: '121-platform/commonjs',
      files: ['**/*.js'],
      languageOptions: {
        sourceType: 'script',
      },
    },
    javascript: {
      name: '121-platform/javascript',
      files: ['**/*.mjs'],
      languageOptions: {
        ecmaVersion: 2022, // NOTE: Align with Node.js version from: `.node-version`-file
        sourceType: 'module',
      },
    },
    typescript: {
      name: '121-platform/typescript',
      rules: {
        'n/no-extraneous-import': 'off', // Managed by TypeScript
        'n/no-missing-import': 'off', // Disabled to allow for path-aliases via tsconfig.json
      },
    },
    services: {
      name: '121-platform/services',
      extends: [],
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
    },
    final: {
      name: '121-platform/final',
      extends: [eslintPluginPrettierRecommended],
    },
  },
};
