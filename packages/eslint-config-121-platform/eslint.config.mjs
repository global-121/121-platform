import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import eslintPluginComments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

export default defineConfig(
  {
    name: 'self',
    languageOptions: {
      globals: globals.node,
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
  eslintPluginPrettierRecommended,
);
