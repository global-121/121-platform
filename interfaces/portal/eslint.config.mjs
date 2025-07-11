import eslint from '@eslint/js';
import pluginQuery from '@tanstack/eslint-plugin-query';
import angularEslint from 'angular-eslint';
import eslintPluginComments from 'eslint-plugin-eslint-comments';
import eslintPluginNoRelativePaths from 'eslint-plugin-no-relative-import-paths';
import eslintPluginPerfectionist from 'eslint-plugin-perfectionist';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import eslintPluginRegexp from 'eslint-plugin-regexp';
import eslintPluginSimpleSort from 'eslint-plugin-simple-import-sort';
import eslintSortClassMembers from 'eslint-plugin-sort-class-members';
import eslintTailwind from 'eslint-plugin-tailwindcss';
import globals from 'globals';
import tsEslint from 'typescript-eslint';

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
    files: ['**/*.ts'],
    plugins: {
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
    extends: [
      ...angularEslint.configs.templateRecommended,
      ...angularEslint.configs.templateAccessibility,
      ...eslintTailwind.configs['flat/recommended'],
      eslintPluginPrettierRecommended,
    ],
    files: ['src/app/**/*.html'],
    rules: {
      '@angular-eslint/template/i18n': [
        'error',
        {
          checkId: false,
          ignoreAttributes: [
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
            'app-query-table[localStorageKey]',
            'app-query-table[initialSortField]',
            'iframe[referrerpolicy]',
            'iframe[loading]',
            'iframe[sandbox]',
          ],
        },
      ],
      'prettier/prettier': [
        'error',
        {
          parser: 'angular',
        },
      ],
      'tailwindcss/enforces-negative-arbitrary-values': 'error',
      'tailwindcss/no-contradicting-classname': 'error',
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
      ecmaVersion: 2022,
      globals: {
        module: 'readonly',
        process: 'readonly',
        require: 'readonly',
      },
    },
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
