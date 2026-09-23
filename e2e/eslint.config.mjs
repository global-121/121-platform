import { defineConfig, globalIgnores } from 'eslint/config';
import eslintConfig121Platform from 'eslint-config-121-platform';
import playwright from 'eslint-plugin-playwright';
import tsEslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores(['dist/**', 'test-results/**', 'playwright-report/**']),
  eslintConfig121Platform.configs.base,
  eslintConfig121Platform.configs.recommended,
  eslintConfig121Platform.configs.recommendedNext,
  eslintConfig121Platform.configs.node,
  eslintConfig121Platform.configs.javascript,
  eslintConfig121Platform.configs.typescript,
  eslintConfig121Platform.configs.services,
  {
    name: 'TypeScript files',
    files: ['**/*.ts'],
    extends: [
      tsEslint.configs.recommended,
      tsEslint.configs.stylisticTypeChecked,
    ],
  },
  {
    name: 'Playwright recommended and best practice rules',
    files: ['**/*.ts'],
    plugins: {
      playwright,
    },
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Keep no-empty-pattern enabled so existing disable comments remain valid
      'no-empty-pattern': 'error',
      // Block critical issues that break tests or leak debugging code
      'playwright/no-focused-test': 'error',
      'playwright/no-page-pause': 'error',
      'playwright/missing-playwright-await': 'error',
      'playwright/valid-expect': 'error',
      'playwright/valid-describe-callback': 'error',
      'playwright/valid-expect-in-promise': 'error',
      'playwright/no-standalone-expect': 'off',
      // Warn on known flaky/bad Playwright patterns (per Playwright best practices)
      'playwright/no-wait-for-timeout': 'off',
      'playwright/no-networkidle': 'off',
      'playwright/prefer-web-first-assertions': 'warn',
      'playwright/no-element-handle': 'warn',
      'playwright/no-wait-for-selector': 'warn',
      'playwright/no-force-option': 'warn',
      'playwright/no-conditional-in-test': 'warn',
      'playwright/no-unused-locators': 'warn',
      'playwright/valid-title': 'warn',
      // Turn off noisy stylistic rules handled by Prettier or incompatible with POM assertions
      'playwright/expect-expect': 'off',
      'playwright/consistent-spacing-between-blocks': 'off',
    },
  },
  eslintConfig121Platform.configs.final, // NOTE: This needs to be last! It configures Prettier, to make sure auto-formatting works.
);
