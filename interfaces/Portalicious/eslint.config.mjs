import globals from 'globals';
import eslint from '@eslint/js';
import tsEslint from 'typescript-eslint';
import angularEslint from 'angular-eslint';
import eslintPluginComments from 'eslint-plugin-eslint-comments';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import eslintPluginNoRelativePaths from 'eslint-plugin-no-relative-import-paths';
// @ts-ignore-next-line -- TODO: Check correct type definition for eslint-plugin-query in future version
import pluginQuery from '@tanstack/eslint-plugin-query';
import eslintPluginPerfectionist from 'eslint-plugin-perfectionist';
import eslintPluginRegexp from 'eslint-plugin-regexp';
import eslintPluginSimpleSort from 'eslint-plugin-simple-import-sort';
import eslintSortClassMembers from 'eslint-plugin-sort-class-members';
import eslintTailwind from 'eslint-plugin-tailwindcss';

export default tsEslint.config(
  {
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
  },
  {
    files: ['**/*.ts'],
    plugins: {
      'no-relative-import-paths': eslintPluginNoRelativePaths,
      perfectionist: eslintPluginPerfectionist,
      regexp: eslintPluginRegexp,
      'simple-import-sort': eslintPluginSimpleSort,
      'eslint-comments': eslintPluginComments,
    },
    extends: [
      eslint.configs.recommended,
      ...tsEslint.configs.strictTypeChecked,
      ...tsEslint.configs.stylisticTypeChecked,
      ...angularEslint.configs.tsRecommended,
      ...pluginQuery.configs['flat/recommended'],
      eslintPluginRegexp.configs['flat/recommended'],
      eslintSortClassMembers.configs['flat/recommended'],
      ...eslintTailwind.configs['flat/recommended'],
      eslintPluginPrettierRecommended,
    ],
    processor: angularEslint.processInlineTemplates,
    rules: {
      '@typescript-eslint/method-signature-style': 'error',
      '@typescript-eslint/no-extraneous-class': [
        'error',
        {
          allowWithDecorator: true,
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-max-inline-declarations': [
        'error',
        { template: 20 },
      ],
      '@angular-eslint/no-async-lifecycle-method': ['error'],
      '@angular-eslint/no-conflicting-lifecycle': ['error'],
      '@angular-eslint/prefer-on-push-component-change-detection': ['error'],
      '@angular-eslint/prefer-output-readonly': ['error'],
      '@angular-eslint/prefer-standalone': ['error'],
      '@angular-eslint/prefer-signals': ['error'],
      '@angular-eslint/sort-lifecycle-methods': ['error'],
      '@angular-eslint/use-component-selector': ['error'],
      '@angular-eslint/use-lifecycle-interface': ['error'],
      'max-params': ['error', 2],
      'eslint-comments/require-description': 'error',
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
      'simple-import-sort/exports': 'error',
      'arrow-body-style': 'error',
      'func-style': 'error',
      'no-inner-declarations': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
    },
  },
  {
    files: ['src/app/**/*.html'],
    extends: [
      ...angularEslint.configs.templateRecommended,
      ...angularEslint.configs.templateAccessibility,
      ...eslintTailwind.configs['flat/recommended'],
      eslintPluginPrettierRecommended,
    ],
    rules: {
      '@angular-eslint/template/i18n': [
        'error',
        {
          checkId: false,
          ignoreAttributes: [
            'app-query-table[localStorageKey]',
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
            'queryParamsHandling',
            'styleClass',
            'severity',
            'th[pSortableColumn]',
            'app-button-menu[size]',
            'app-colored-chip[variant]',
            'app-confirmation-dialog[headerClass]',
            'app-confirmation-dialog[headerIcon]',
            'app-file-upload-control[accept]',
            'app-import-file-dialog[accept]',
            'app-metric-tile[chipIcon]',
            'app-metric-tile[chipVariant]',
            'iframe[referrerpolicy]',
            'iframe[loading]',
            'iframe[sandbox]',
          ],
        },
      ],
      'tailwindcss/no-contradicting-classname': 'error',
      'tailwindcss/enforces-negative-arbitrary-values': 'error',
      'tailwindcss/no-custom-classname': [
        'error',
        {
          whitelist: [
            // Allow PrimeNG component/icon classes:
            'p\\-.*',
            'pi',
            'pi\\-.*',
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
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        module: 'readonly',
        process: 'readonly',
        require: 'readonly',
      },
    },
    plugins: {
      regexp: eslintPluginRegexp,
      'eslint-comments': eslintPluginComments,
    },
    extends: [
      eslint.configs.recommended,
      eslintPluginRegexp.configs['flat/recommended'],
      eslintPluginPerfectionist.configs['recommended-natural'],
      eslintPluginPrettierRecommended,
    ],
    rules: {
      'eslint-comments/require-description': 'error',
      'arrow-body-style': 'error',
      'func-style': 'error',
      'no-inner-declarations': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
    },
  },
);
