import type { ESLint, Linter } from 'eslint';

export interface EslintConfig121Platform extends ESLint.Plugin {
  configs: Record<string, Linter.Config[]>;
}

declare const eslintConfig121Platform: EslintConfig121Platform;

export default eslintConfig121Platform;
