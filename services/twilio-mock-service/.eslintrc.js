/** @type {import('@typescript-eslint/utils/dist/ts-eslint/Linter').Linter.Config} */
module.exports = {
  overrides: [
    {
      files: ['*.js'],
      extends: ['eslint:recommended', 'plugin:prettier/recommended'],
      env: {
        node: true,
      },
      parserOptions: {
        sourceType: 'script',
        ecmaVersion: 2021,
      },
      rules: {},
    },
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      extends: [
        'plugin:jest/recommended',
        'plugin:@typescript-eslint/recommended',
        // 'plugin:@typescript-eslint/recommended-type-checked', // Preferred, but currently to many issues
        'plugin:@typescript-eslint/stylistic',
        // 'plugin:@typescript-eslint/stylistic-type-checked',  // Preferred, but currently to many issues
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
        '@typescript-eslint/interface-name-prefix': 'off',
        '@typescript-eslint/explicit-function-return-type': [
          'error',
          {
            allowExpressions: true,
          },
        ],
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/no-misused-promises': 'error',
        '@typescript-eslint/no-parameter-properties': 'off',
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            varsIgnorePattern: '^_',
            argsIgnorePattern: '^_',
          },
        ],
        'promise/no-nesting': 'error',
        'promise/no-callback-in-promise': 'error',
        'promise/no-multiple-resolved': 'error',
        'promise/no-promise-in-callback': 'error',
        'promise/no-return-in-finally': 'error',
        // 'promise/prefer-await-to-callbacks': 'warn', // TODO: Enable (locally only) to see if there is something to refactor.
        // 'promise/prefer-await-to-then': 'warn', // TODO: Enable (locally only) to see if there is something to refactor.
        'promise/valid-params': 'error',
        'prettier/prettier': ['error', { endOfLine: 'auto' }],
      },
    },
  ],
};
