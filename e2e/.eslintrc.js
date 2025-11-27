/** @type {import('@typescript-eslint/utils/dist/ts-eslint/Linter').Linter.Config} */
module.exports = {
  env: {
    node: true,
  },
  plugins: ['simple-import-sort'],
  overrides: [
    {
      files: ['*.js'],
      extends: [
        'eslint:recommended',
        'plugin:n/recommended',
        'plugin:prettier/recommended',
      ],
      parserOptions: {
        sourceType: 'script',
        ecmaVersion: 2021,
      },
      rules: {},
    },
    {
      files: ['*.ts'],
      parser: '@typescript-eslint/parser',
      extends: [
        'plugin:@typescript-eslint/recommended',
        // 'plugin:@typescript-eslint/recommended-type-checked', // Preferred, but currently to many issues
        'plugin:@typescript-eslint/stylistic-type-checked',
        'plugin:promise/recommended',
        'plugin:prettier/recommended', // Enables eslint-plugin-prettier and displays prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
      ],
      parserOptions: {
        parser: '@typescript-eslint/parser',
        ecmaVersion: 2021, // Allows for the parsing of modern ECMAScript features
        sourceType: 'module', // Allows for the use of imports
        project: true,
        tsconfigRootDir: __dirname,
      },
      rules: {
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/no-misused-promises': 'error',
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
        'n/no-process-env': 'error',
        'n/prefer-node-protocol': 'error',
        'object-shorthand': 'error',
        'promise/no-nesting': 'error',
        'promise/no-callback-in-promise': 'error',
        'promise/no-multiple-resolved': 'error',
        'promise/no-promise-in-callback': 'error',
        'promise/no-return-in-finally': 'error',
        'promise/prefer-await-to-callbacks': 'error',
        'promise/prefer-await-to-then': 'error',
        'promise/valid-params': 'error',
        'simple-import-sort/imports': [
          'error',
          {
            groups: [
              // Packages.
              // Things that start with a letter (or digit or underscore), or `@` followed by a letter.
              ['^@?\\w'],
              // Alias imports
              ['^@121-portal', '^@121-service'],
              // Local imports
              ['^@121-e2e'],
              // Relative imports.
              // Anything that starts with a dot.
              ['^\\.'],
            ],
          },
        ],
        'simple-import-sort/exports': 'error',
        'prettier/prettier': ['error', { endOfLine: 'auto' }],
        '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      },
    },
  ],
};
