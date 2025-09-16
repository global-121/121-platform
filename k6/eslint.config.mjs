import pluginJs from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import eslintPluginSortImports from 'eslint-plugin-simple-import-sort';
import globals from 'globals';

export default [
  { languageOptions: { globals: { ...globals.node } } },
  pluginJs.configs.recommended,
  eslintConfigPrettier,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        __ENV: 'readonly',
        // ...other globals
      },
    },
    files: ['**/*.js'],
  },
  {
    plugins: {
      'simple-import-sort': eslintPluginSortImports,
    },
    rules: {
      'object-shorthand': 'error',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
];
