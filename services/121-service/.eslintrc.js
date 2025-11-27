/** @type {import('eslint').Linter.Config} */
module.exports = {
  overrides: [
    {
      files: ['*.js'],
      extends: [
        'eslint:recommended',
        'plugin:n/recommended',
        'plugin:prettier/recommended',
      ],
      env: {
        node: true,
      },
      parserOptions: {
        sourceType: 'script',
        ecmaVersion: 2022,
      },
      rules: {},
    },
    {
      files: ['*.ts'],
      parser: '@typescript-eslint/parser',
      plugins: ['no-relative-import-paths', 'simple-import-sort'],
      extends: [
        'plugin:@typescript-eslint/recommended',
        // 'plugin:@typescript-eslint/recommended-type-checked', // Preferred, but currently to many issues
        'plugin:@typescript-eslint/stylistic',
        // 'plugin:@typescript-eslint/stylistic-type-checked',  // Preferred, but currently to many issues
        'plugin:n/recommended',
        'plugin:promise/recommended',
        'plugin:prettier/recommended', // Enables eslint-plugin-prettier and displays prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
      ],
      parserOptions: {
        parser: '@typescript-eslint/parser',
        ecmaVersion: 2022, // Allows for the parsing of modern ECMAScript features
        sourceType: 'module', // Allows for the use of imports
        project: true,
        tsconfigRootDir: __dirname,
      },
      rules: {
        '@typescript-eslint/interface-name-prefix': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/no-misused-promises': 'error',
        '@typescript-eslint/no-parameter-properties': 'off',
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            varsIgnorePattern: '^_',
            argsIgnorePattern: '^_',
            caughtErrors: 'none',
          },
        ],
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['process', 'node:process'],
                importNames: ['env'],
                message: 'Import ENV-variables from env.ts only.',
              },
            ],
          },
        ],
        'object-shorthand': 'error',
        'promise/no-nesting': 'error',
        'promise/no-callback-in-promise': 'error',
        'promise/no-multiple-resolved': 'error',
        'promise/no-promise-in-callback': 'error',
        'promise/no-return-in-finally': 'error',
        // 'promise/prefer-await-to-callbacks': 'warn', // TODO: Enable (locally only) to see if there is something to refactor.
        // 'promise/prefer-await-to-then': 'warn', // TODO: Enable (locally only) to see if there is something to refactor.
        'promise/valid-params': 'error',
        'prettier/prettier': ['error', { endOfLine: 'auto' }],
        'n/no-extraneous-import': [0], // Managed by TypeScript
        'n/no-missing-import': [0, { ignoreTypeImport: true }], // Disabled to allow for path-aliases via tsconfig.json/below
        'n/no-process-env': 'error',
        'n/no-unsupported-features/node-builtins': [
          'error',
          {
            ignores: ['Headers'],
          },
        ],
        'n/prefer-node-protocol': 'error',
        'no-relative-import-paths/no-relative-import-paths': [
          'warn',
          {
            prefix: '@121-service',
            rootDir: '.',
          },
        ],
        'no-restricted-syntax': [
          'error',
          {
            selector:
              "ObjectExpression > .properties[key.name='where'] > .value > .properties:not(:has(CallExpression)), ObjectExpression > .properties[key.name='where'] > .value > .properties > .value > .properties:not(:has(CallExpression))",
            message:
              'Unsafe where condition, that can leak data. Use Equal() instead.',
          },
          {
            selector:
              "ObjectExpression > .properties[key.name='andWhere'] > .value > .properties:not(:has(CallExpression)), ObjectExpression > .properties[key.name='where'] > .value > .properties > .value > .properties:not(:has(CallExpression))",
            message:
              'Unsafe where condition, that can leak data. Use Equal() instead.',
          },
        ],
        'simple-import-sort/imports': [
          'error',
          {
            groups: [
              // Packages.
              // Things that start with a letter (or digit or underscore), or `@` followed by a letter.
              ['^@?\\w'],
              // Alias imports
              ['^@121-service'],
              // Relative imports.
              // Anything that starts with a dot.
              ['^\\.'],
            ],
          },
        ],
        'simple-import-sort/exports': 'error',
      },
      overrides: [
        {
          files: ['*.entity.ts'],
          plugins: ['custom-rules'],
          rules: {
            'custom-rules/typeorm-cascade-ondelete': 'error',
          },
        },
        {
          files: ['*.spec.ts', '*.test.ts'],
          extends: ['plugin:jest/recommended'],
        },
      ],
    },
  ],
};
