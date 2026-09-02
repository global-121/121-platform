const baseOptions = {
  jsc: {
    target: 'es2024', // matches tsconfig target
    keepClassNames: true, // TypeORM entity/table naming depends on class names
    transform: {
      // mirrors tsconfig experimentalDecorators + emitDecoratorMetadata (needed for NestJS DI)
      legacyDecorator: true,
      decoratorMetadata: true,
    },
  },
  module: { type: 'commonjs' },
  sourceMaps: 'inline',
};

const typescriptOptions = {
  ...baseOptions,
  jsc: {
    ...baseOptions.jsc,
    parser: { syntax: 'typescript', decorators: true },
  },
};

// For transforming pure-JS ESM-only dependencies (see transformIgnorePatterns in jest configs)
const esmNodeModuleOptions = {
  ...baseOptions,
  jsc: {
    ...baseOptions.jsc,
    parser: { syntax: 'ecmascript' },
  },
};

export default { typescriptOptions, esmNodeModuleOptions };
