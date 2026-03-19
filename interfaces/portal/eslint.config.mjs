import eslint from '@eslint/js';
import pluginQuery from '@tanstack/eslint-plugin-query';
import angularEslint from 'angular-eslint';
import eslintConfig121Platform from 'eslint-config-121-platform';
import eslintPluginBetterTailwindcss from 'eslint-plugin-better-tailwindcss';
import eslintPluginNoRelativePaths from 'eslint-plugin-no-relative-import-paths';
import eslintPluginPerfectionist from 'eslint-plugin-perfectionist';
import eslintPluginRegexp from 'eslint-plugin-regexp';
import eslintPluginSimpleSort from 'eslint-plugin-simple-import-sort';
import eslintSortClassMembers from 'eslint-plugin-sort-class-members';
import { defineConfig, globalIgnores } from 'eslint/config';
import tsEslint from 'typescript-eslint';

import noFormControlUndefinedValue from './eslint-rules/no-form-control-undefined-value.mjs';
import tanstackNoManualCacheInvalidation from './eslint-rules/tanstack-no-manual-cache-invalidation.mjs';

/** @type {import('eslint').ESLint.Plugin} */
const customRulesPlugin = {
  rules: {
    'no-form-control-undefined-value': noFormControlUndefinedValue,
    'tanstack-no-manual-cache-invalidation': tanstackNoManualCacheInvalidation,
  },
};
const customRulesConfig = defineConfig({
  plugins: {
    'custom-rules': customRulesPlugin,
  },
  rules: {
    'custom-rules/no-form-control-undefined-value': 'error',
    'custom-rules/tanstack-no-manual-cache-invalidation': 'error',
  },
});

/* eslint-disable perfectionist/sort-objects -- Keep the config readable, by NOT sorting alphabetically automatically. */
export default defineConfig(
  globalIgnores(['dist/**', 'www/**', '.angular/**', 'coverage/**']),
  {
    name: 'Specific Config file exceptions ONLY',
    files: ['karma.conf.js', 'knip.config.js'],
    // These exceptions should be minimal, until all these config-files can be converted to be ESM.
    extends: [eslintConfig121Platform.configs.legacyNode],
  },
  eslintConfig121Platform.configs.base,
  eslintConfig121Platform.configs.recommended,
  eslintConfig121Platform.configs.recommendedNext,
  eslintConfig121Platform.configs.javascript,
  eslintConfig121Platform.configs.typescript,
  {
    name: 'Build- or Config JavaScript files',
    files: ['**/*.mjs'],
    extends: [
      eslintPluginRegexp.configs['flat/recommended'],
      eslintPluginPerfectionist.configs['recommended-natural'],
    ],
    plugins: {
      regexp: eslintPluginRegexp,
    },
    rules: {
      'func-style': 'error',
    },
  },
  {
    name: 'TypeScript files',
    files: ['**/*.ts'],
    extends: [
      eslintConfig121Platform.configs.browser,
      ...customRulesConfig,
      ...tsEslint.configs.strictTypeChecked,
      ...tsEslint.configs.stylisticTypeChecked,
      ...angularEslint.configs.tsRecommended,
      ...pluginQuery.configs['flat/recommended'],
      eslintPluginRegexp.configs['flat/recommended'],
      eslintSortClassMembers.configs['flat/recommended'],
    ],
    plugins: {
      'no-relative-import-paths': eslintPluginNoRelativePaths,
      perfectionist: eslintPluginPerfectionist,
      regexp: eslintPluginRegexp,
      'simple-import-sort': eslintPluginSimpleSort,
    },
    processor: angularEslint.processInlineTemplates,
    rules: {
      '@angular-eslint/component-max-inline-declarations': [
        'error',
        { template: 20 },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          prefix: 'app',
          style: 'kebab-case',
          type: 'element',
        },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        {
          prefix: 'app',
          style: 'camelCase',
          type: 'attribute',
        },
      ],
      '@angular-eslint/no-async-lifecycle-method': ['error'],
      '@angular-eslint/prefer-on-push-component-change-detection': ['error'],
      '@angular-eslint/prefer-output-readonly': ['error'],
      '@angular-eslint/prefer-signals': ['error'],
      '@angular-eslint/prefer-standalone': ['error'],
      '@angular-eslint/sort-lifecycle-methods': ['error'],
      '@angular-eslint/use-component-selector': ['error'],
      '@angular-eslint/use-lifecycle-interface': ['error'],
      '@typescript-eslint/method-signature-style': 'error',
      '@typescript-eslint/no-extraneous-class': [
        'error',
        {
          allowWithDecorator: true,
        },
      ],
      'n/no-unsupported-features/node-builtins': ['off'], // These files are for browsers, we don't want false-positives on not-yet-supported-in-Node.js features already covered by `configs.browser`.
      'func-style': 'error',
      'max-params': ['error', 2],
      'no-relative-import-paths/no-relative-import-paths': [
        'error',
        {
          prefix: '~',
          rootDir: './src/app',
        },
      ],
      'perfectionist/sort-array-includes': ['error'],
      'perfectionist/sort-enums': ['error'],
      'perfectionist/sort-intersection-types': ['error'],
      'perfectionist/sort-union-types': ['error'],
      'simple-import-sort/exports': 'error',
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // Angular packages.
            ['^@angular'],
            // Packages.
            // Things that start with a letter (or digit or underscore), or `@` followed by a letter.
            ['^@?\\w'],
            // Alias imports
            ['^@121-service'],
            // Local imports
            // Anything that starts with a tilde.
            ['^~'],
          ],
        },
      ],
    },
  },
  {
    name: '(Unit-)test files',
    files: ['**/*.spec.ts'],
    rules: {
      // This rule triggers for spy objects where the spied-upon method uses
      // `this`. In that case the underlying method is just not called so the
      // rule is irrelevant.
      '@typescript-eslint/unbound-method': 'off',
    },
  },
  {
    name: 'Component templates (HTML)',
    files: ['src/app/**/*.html'],
    extends: [
      ...angularEslint.configs.templateRecommended,
      ...angularEslint.configs.templateAccessibility,
    ],
    plugins: {
      'better-tailwindcss': eslintPluginBetterTailwindcss,
    },
    rules: {
      ...eslintPluginBetterTailwindcss.configs['recommended-error'].rules,
      '@angular-eslint/template/i18n': [
        'error',
        {
          checkId: false,
          ignoreAttributes: [
            'a[rel]',
            'data-testid',
            'field',
            'img[ngSrc]',
            'inputStyleClass',
            'ng-container[slot]',
            'p-button[icon]',
            'p-button[iconPos]',
            'p-button[size]',
            'p-columnFilter[display]',
            'p-drawer[position]',
            'p-fileUpload[accept]',
            'p-fileUpload[mode]',
            'p-fileUpload[removeStyleClass]',
            'p-iconField[iconPosition]',
            'p-inputSwitch[inputId]',
            'p-select[optionValue]',
            'p-splitButton[icon]',
            'p-splitButton[menuStyleClass]',
            'p-table[stateKey]',
            'p-table[stateStorage]',
            'appendTo',
            'inputId',
            'input[inputmode]',
            'queryParamsHandling',
            'styleClass',
            'severity',
            'th[pSortableColumn]',
            'app-button-menu[size]',
            'app-colored-chip[variant]',
            'app-form-dialog[headerClass]',
            'app-form-dialog[headerIcon]',
            'app-file-upload-control[accept]',
            'app-import-file-dialog[accept]',
            'app-metric-tile[chipIcon]',
            'app-metric-tile[chipVariant]',
            'app-query-table[localStorageKey]',
            'app-query-table[initialSortField]',
            'iframe[referrerpolicy]',
            'iframe[loading]',
            'iframe[sandbox]',
          ],
        },
      ],
      '@angular-eslint/template/label-has-associated-control': [
        'error',
        {
          controlComponents: [
            'p-toggleSwitch',
            'p-checkbox',
            'p-radioButton',
            'ng-content',
            'app-form-error',
          ],
          labelComponents: [
            {
              inputs: [
                'for',
                'htmlFor',
                'id',
                'inputId',
                'input-id',
                'formControlName',
              ],
              selector: 'label',
            },
          ],
        },
      ],
      'better-tailwindcss/enforce-consistent-class-order': 'off', // handled by Prettier
      'better-tailwindcss/enforce-consistent-important-position': 'error',
      'better-tailwindcss/enforce-consistent-line-wrapping': 'off', // handled by Prettier
      'better-tailwindcss/no-conflicting-classes': 'error',
      'better-tailwindcss/no-deprecated-classes': 'error',
      'better-tailwindcss/no-restricted-classes': 'error',
      'better-tailwindcss/no-unknown-classes': [
        'error',
        {
          ignore: [
            // Allow PrimeNG component/icon classes:
            'p\\-.*',
            'pi',
            'pi\\-.*',
            'ng-invalid',
            'ng-dirty',
          ],
        },
      ],
      'better-tailwindcss/no-unnecessary-whitespace': 'off', // handled by Prettier
      'prettier/prettier': [
        'error',
        {
          parser: 'angular',
        },
      ],
    },
    settings: {
      'better-tailwindcss': {
        entryPoint: 'src/styles.css',
      },
    },
  },
  {
    name: 'Browser-only JavaScript files',
    files: ['src/**/*.js', 'src/**/*.mjs'],
    extends: [
      eslintConfig121Platform.configs.browser,
      eslint.configs.recommended,
    ],
  },

  eslintConfig121Platform.configs.final, // NOTE: This needs to be last! It configures Prettier, to make sure auto-formatting works.
);
/* eslint-enable perfectionist/sort-objects -- Only the configs-collection needs manual sorting. */
