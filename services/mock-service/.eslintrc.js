/** @type {import('@typescript-eslint/utils/dist/ts-eslint/Linter').Linter.Config} */
module.exports = {
  overrides: [
    {
      files: ['*.js', '*.mjs'],
      extends: [
        'eslint:recommended',
        'plugin:eslint-comments/recommended',
        'plugin:n/recommended',
        'plugin:regexp/recommended',
        'plugin:prettier/recommended',
      ],
      env: {
        node: true,
      },
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2022,
      },
      rules: {
        'eslint-comments/no-unused-disable': 'error',
        'eslint-comments/require-description': 'error',
      },
    },
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: ['no-relative-import-paths', 'regexp', 'simple-import-sort'],
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/stylistic',
        'plugin:eslint-comments/recommended',
        'plugin:n/recommended',
        'plugin:regexp/recommended',
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
            caughtErrors: 'none',
          },
        ],
        'eslint-comments/no-unused-disable': 'error',
        'eslint-comments/require-description': 'error',
        'object-shorthand': 'error',
        'prettier/prettier': ['error', { endOfLine: 'auto' }],
        'n/no-missing-import': [0, { ignoreTypeImport: true }], // Disabled to allow for path-aliases via tsconfig.json/below
        'n/no-extraneous-import': [0], // Managed by TS
        'n/no-process-env': 'error',
        'no-relative-import-paths/no-relative-import-paths': [
          'warn',
          {
            prefix: '@mock-service',
            rootDir: '.',
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
              ['^@mock-service'],
              // Relative imports.
              // Anything that starts with a dot.
              ['^\\.'],
            ],
          },
        ],
        'simple-import-sort/exports': 'error',
      },
    },
  ],
};
