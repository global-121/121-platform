import eslint from '@eslint/js';
import pluginQuery from '@tanstack/eslint-plugin-query';
import angularEslint from 'angular-eslint';
import eslintPluginBetterTailwindcss from 'eslint-plugin-better-tailwindcss';
import eslintPluginComments from 'eslint-plugin-eslint-comments';
import eslintPluginNoRelativePaths from 'eslint-plugin-no-relative-import-paths';
import eslintPluginPerfectionist from 'eslint-plugin-perfectionist';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import eslintPluginRegexp from 'eslint-plugin-regexp';
import eslintPluginSimpleSort from 'eslint-plugin-simple-import-sort';
import eslintSortClassMembers from 'eslint-plugin-sort-class-members';
import globals from 'globals';
import tsEslint from 'typescript-eslint';

// Import custom rule
import noFormControlUndefinedValue from './eslint-rules/no-form-control-undefined-value.js';
import tanstackNoManualCacheInvalidation from './eslint-rules/tanstack-no-manual-cache-invalidation.js';

// Custom rules plugin
const customRulesPlugin = {
  rules: {
    'no-form-control-undefined-value': noFormControlUndefinedValue,
    'tanstack-no-manual-cache-invalidation': tanstackNoManualCacheInvalidation,
  },
};

export default tsEslint.config(
  {
    languageOptions: {
      globals: globals.browser,
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
      ...tsEslint.configs.strictTypeChecked,
      ...tsEslint.configs.stylisticTypeChecked,
      ...angularEslint.configs.tsRecommended,
      ...pluginQuery.configs['flat/recommended'],
      eslintPluginRegexp.configs['flat/recommended'],
      eslintSortClassMembers.configs['flat/recommended'],
      eslintPluginPrettierRecommended,
    ],
    files: ['**/*.ts'],
    name: 'TypeScript files',
    plugins: {
      'custom-rules': customRulesPlugin,
      'eslint-comments': eslintPluginComments,
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
      '@angular-eslint/no-conflicting-lifecycle': ['error'],
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
      'arrow-body-style': 'error',
      'custom-rules/no-form-control-undefined-value': 'error',
      'custom-rules/tanstack-no-manual-cache-invalidation': 'error',
      'eslint-comments/require-description': 'error',
      'func-style': 'error',
      'max-params': ['error', 2],
      'no-inner-declarations': 'error',
      'no-relative-import-paths/no-relative-import-paths': [
        'error',
        {
          prefix: '~',
          rootDir: './src/app',
        },
      ],
      'object-shorthand': 'error',
      'perfectionist/sort-array-includes': ['error'],
      'perfectionist/sort-enums': ['error'],
      'perfectionist/sort-intersection-types': ['error'],
      'perfectionist/sort-union-types': ['error'],
      'prefer-arrow-callback': 'error',
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
    files: ['**/app.config.ts'],
    rules: {
      'custom-rules/tanstack-no-manual-cache-invalidation': 'off',
    },
  },
  {
    files: ['**/*.spec.ts'],
    name: '(Unit-)test files',
    rules: {
      // This rule triggers for spy objects where the spied-upon method uses
      // `this`. In that case the underlying method is just not called so the
      // rule is irrelevant.
      '@typescript-eslint/unbound-method': 'off',
    },
  },
  {
    extends: [
      ...angularEslint.configs.templateRecommended,
      ...angularEslint.configs.templateAccessibility,
      eslintPluginPrettierRecommended,
    ],
    files: ['src/app/**/*.html'],
    name: 'Component templates (HTML)',
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
      'better-tailwindcss/enforce-consistent-class-order': 'off', // handled by Prettier
      'better-tailwindcss/enforce-consistent-important-position': 'error',
      'better-tailwindcss/enforce-consistent-line-wrapping': 'off', // handled by Prettier
      'better-tailwindcss/no-conflicting-classes': 'error',
      'better-tailwindcss/no-deprecated-classes': 'error',
      'better-tailwindcss/no-restricted-classes': 'error',
      'better-tailwindcss/no-unnecessary-whitespace': 'off', // handled by Prettier
      'better-tailwindcss/no-unregistered-classes': [
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
    extends: [
      eslint.configs.recommended,
      eslintPluginRegexp.configs['flat/recommended'],
      eslintPluginPerfectionist.configs['recommended-natural'],
      eslintPluginPrettierRecommended,
    ],
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022, // NOTE: Align with Node.js version from: `.node-version`-file
      globals: {
        module: 'readonly',
        process: 'readonly',
        require: 'readonly',
      },
    },
    name: 'JavaScript files',
    plugins: {
      'eslint-comments': eslintPluginComments,
      regexp: eslintPluginRegexp,
    },
    rules: {
      'arrow-body-style': 'error',
      'eslint-comments/require-description': 'error',
      'func-style': 'error',
      'no-inner-declarations': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
    },
  },
);
