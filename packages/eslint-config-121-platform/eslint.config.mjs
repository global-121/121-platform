import { defineConfig } from 'eslint/config';
import tsEslint from 'typescript-eslint';

import eslintConfig121Platform from './index.mjs';

export default defineConfig(
  eslintConfig121Platform.configs.base,
  eslintConfig121Platform.configs.node,
  eslintConfig121Platform.configs.recommended,
  eslintConfig121Platform.configs.recommendedNext,
  {
    name: 'TypeScript files',
    files: ['**/*.ts'],
    extends: [
      tsEslint.configs.strictTypeChecked,
      tsEslint.configs.stylisticTypeChecked,
      eslintConfig121Platform.configs.typescript,
    ],
  },
  eslintConfig121Platform.configs.final,
);
