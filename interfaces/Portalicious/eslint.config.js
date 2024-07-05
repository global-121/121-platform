// @ts-check
const globals = require('globals');
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');
const eslintPluginNoRelativePaths = require('eslint-plugin-no-relative-import-paths');

module.exports = tseslint.config(
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
    plugins: { 'no-relative-import-paths': eslintPluginNoRelativePaths },
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
      ...angular.configs.tsRecommended,
      eslintPluginPrettierRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      'no-relative-import-paths/no-relative-import-paths': [
        'error',
        {
          prefix: '~',
          rootDir: './src/app',
        },
      ],
      '@typescript-eslint/no-extraneous-class': [
        'error',
        {
          allowWithDecorator: true,
        },
      ],
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-expect-error': 'allow-with-description',
          'ts-ignore': 'allow-with-description',
          'ts-nocheck': true,
          'ts-check': false,
          minimumDescriptionLength: 10,
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
      '@angular-eslint/no-async-lifecycle-method': ['error'],
      '@angular-eslint/no-conflicting-lifecycle': ['error'],
      '@angular-eslint/prefer-on-push-component-change-detection': ['error'],
      '@angular-eslint/prefer-output-readonly': ['error'],
      '@angular-eslint/prefer-standalone': ['error'],
      '@angular-eslint/sort-lifecycle-methods': ['error'],
      '@angular-eslint/use-component-selector': ['error'],
      '@angular-eslint/use-lifecycle-interface': ['error'],
    },
  },
  {
    files: ['**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
      eslintPluginPrettierRecommended,
    ],
    rules: {
      'prettier/prettier': [
        'error',
        {
          parser: 'angular',
        },
      ],
    },
  },
  {
    files: ['**/*.js'],
    extends: [eslintPluginPrettierRecommended],
    rules: {},
  },
);
