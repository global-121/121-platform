import { defineConfig, globalIgnores } from 'eslint/config';
import eslintConfig121Platform from 'eslint-config-121-platform';
import tsEslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores(['test-results/**', 'playwright-report/**']),
  eslintConfig121Platform.configs.base,
  eslintConfig121Platform.configs.recommended,
  eslintConfig121Platform.configs.recommendedNext,
  eslintConfig121Platform.configs.node,
  eslintConfig121Platform.configs.javascript,
  eslintConfig121Platform.configs.typescript,
  eslintConfig121Platform.configs.typescriptNext,
  eslintConfig121Platform.configs.services,
  {
    name: 'TypeScript files',
    files: ['**/*.ts'],
    extends: [
      tsEslint.configs.recommended,
      tsEslint.configs.stylisticTypeChecked,
    ],
  },
  eslintConfig121Platform.configs.final, // NOTE: This needs to be last! It configures Prettier, to make sure auto-formatting works.
);
