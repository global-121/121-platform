import type { ESLint, Linter } from 'eslint';

interface EslintConfig121Platform extends ESLint.Plugin {
  configs: {
    [key: string]: Linter.Config;
  };
}

declare const eslintConfig121Platform: EslintConfig121Platform;

export default eslintConfig121Platform;
