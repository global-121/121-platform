import type { ESLint, Linter } from 'eslint';

type FlatConfig = Linter.Config;

interface EslintConfig121Platform extends ESLint.Plugin {
  configs: {
    [key: string]: FlatConfig;
  };
}

declare const eslintConfig121Platform: EslintConfig121Platform;

export default eslintConfig121Platform;
