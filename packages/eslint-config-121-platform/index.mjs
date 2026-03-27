import eslint from '@eslint/js';
import eslintPluginComments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import { defineConfig } from 'eslint/config';
import eslintPluginN from 'eslint-plugin-n';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
// @ts-ignore -- No types available for this package, yet. See: https://github.com/eslint-community/eslint-plugin-promise/issues/488
import eslintPluginPromise from 'eslint-plugin-promise';
import eslintPluginSimpleSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';

/**
 * Shared ESLint configuration for all packages of the 121-platform.
 *
 * A few 'building blocks' are provided, which should be composed into a specific configuration for each package,
 * depending on the specific needs. It's NOT necessary or even recommended to use ALL configs together.
 *
 * @example - For a back-end service:
 * ```ts
 * import eslintConfig121Platform from 'eslint-config-121-platform';
 * export default defineConfig({
 *   extends: [
 *     eslintConfig121Platform.configs.base,
 *     eslintConfig121Platform.configs.node,
 *     eslintConfig121Platform.configs.typescript,
 *     eslintConfig121Platform.configs.services,
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
    /**
     * Baseline settings/rules for all packages, regardless of environment/language.
     * To align the editor's experience across all packages.
     */
    base: defineConfig({
      name: '121-platform/base',
      languageOptions: {
        parserOptions: {
          projectService: true,
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
    /**
     * Only necessary to make _specific_ exceptions for old-style/CommonJS files, like some config-files.
     */
    legacyNode: defineConfig({
      name: '121-platform/legacy-node',
      languageOptions: {
        globals: globals.node,
      },
    }),
    /**
     * Allow browser-specific properties/methods(like `window.*` or `document.*`) not Node.js-specific ones (which won't work in a browser).
     */
    browser: defineConfig({
      name: '121-platform/browser',
      languageOptions: {
        globals: globals.browser,
      },
    }),
    /**
     * Node.js-specific settings/rules. (Not generic enough to be in the `recommended`-config)
     */
    node: defineConfig({
      name: '121-platform/node',
      files: ['**/*.mjs', '**/*.ts'],
      languageOptions: {
        ecmaVersion: 2022, // NOTE: Align with Node.js version from: `.node-version`-file
        sourceType: 'module',
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
    /**
     * Recommended coding practices, for both (ESM) JavaScript and TypeScript.
     * For use as application-code or command-line/build-scripts.
     */
    recommended: defineConfig({
      name: '121-platform/recommended',
      files: ['**/*.mjs', '**/*.ts'],
      languageOptions: {
        ecmaVersion: 2022, // NOTE: Align with Node.js version from: `.node-version`-file
        sourceType: 'module',
        globals: globals.nodeBuiltin,
      },
      plugins: {
        'simple-import-sort': eslintPluginSimpleSort,
      },
      extends: [eslintPluginPromise.configs['flat/recommended']],
      rules: {
        'object-shorthand': 'error',
        'prefer-arrow-callback': 'error',
        'no-inner-declarations': 'error',
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
              // Angular packages. (Only relevant for the Portal)
              ['^@angular'],
              // Other Packages. (Things that start with a letter (or digit or underscore), or `@` followed by a letter, or contain a "/")
              ['^@?[\\w/]'],
              // Alias imports
              ['^@121-portal', '^@121-service', '^@mock-service'],
              ['^@121-e2e'],
              // Relative imports.
              // Anything that starts with a dot.
              ['^\\.'],
              // Anything that starts with a tilde. (Only relevant for the Portal)
              ['^~'],
            ],
          },
        ],
      },
    }),
    /**
     * More 'advanced' recommended coding practices.
     * These rules should be considered 'TODO:'-items to fix in the 121-service, so they can we added to the `recommended`-config.
     *
     * <!> Before adding a rule here:
     * Check wether it is possible to add to the `recommended`-config first;
     * Only add here if there are too many violations in the 121-service' code.
     */
    recommendedNext: defineConfig({
      name: '121-platform/recommended-next',
      files: ['**/*.mjs', '**/*.ts'],
      rules: {
        'arrow-body-style': 'error',
        'func-style': 'error',
        'promise/prefer-await-to-callbacks': 'error',
        'promise/prefer-await-to-then': 'error',
      },
    }),
    /**
     * Rules specific to JavaScript files
     * Only when not relevant for TypeScript files, like rules that are already managed by the TypeScript compiler.
     */
    javascript: defineConfig({
      name: '121-platform/javascript',
      files: ['**/*.mjs'],
    }),
    /**
     * Rules/options specific to TypeScript ONLY.
     *
     * This config is NOT meant to be used as 'only a preset' for TypeScript-files, but to set specific rules only relevant for TypeScript files and not JavaScript files.
     */
    typescript: defineConfig({
      name: '121-platform/typescript',
      files: ['**/*.ts'],
      plugins: {
        n: eslintPluginN,
      },
      rules: {
        'n/no-extraneous-import': 'off', // Managed by TypeScript
        'n/no-missing-import': 'off', // Disabled to allow for path-aliases via tsconfig.json
        '@typescript-eslint/consistent-type-definitions': [
          'error',
          'interface',
        ],
        '@typescript-eslint/method-signature-style': 'error',
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
    /**
     * Rules specific to all the 121-platform's services.
     *
     * These rules should be generic enough to be applied to all services,
     * but not relevant for other types of packages (like the Portal, or build-scripts).
     */
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
    /**
     * Required to be used LAST!
     * After all other rules are applied, this config will ensure that the code is formatted by Prettier,
     * Any formatting issues will be reported as lint-errors.
     */
    final: defineConfig({
      name: '121-platform/final',
      files: ['**/*.js', '**/*.mjs', '**/*.ts', 'src/app/**/*.html'],
      extends: [eslintPluginPrettierRecommended],
    }),
  },
};
