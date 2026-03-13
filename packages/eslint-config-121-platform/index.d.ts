import type { Linter } from 'eslint';

type FlatConfig = Linter.Config;

interface EslintConfig121Platform {
  configs: {
    [key: string]: FlatConfig;
  };
}
