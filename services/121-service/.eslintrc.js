module.exports = {
  overrides: [
    {
      files: ['*.js'],
      extends: ['eslint:recommended', 'plugin:prettier/recommended'],
      env: {
        node: true,
      },
      rules: {},
    },
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser', // Specifies the ESLint parser
      extends: [
        'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin
        'plugin:jest/recommended',
        // 'prettier/@typescript-eslint', // Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
        'plugin:prettier/recommended', // Enables eslint-plugin-prettier and displays prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
      ],
      parserOptions: {
        parser: '@typescript-eslint/parser',
        ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
        sourceType: 'module', // Allows for the use of imports
        // project: true, //removed because I am not able to run unit tests
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.json'],
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
        '@typescript-eslint/no-parameter-properties': 'off',
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            varsIgnorePattern: '^_',
            argsIgnorePattern: '^_',
          },
        ],
        'prettier/prettier': ['error', { endOfLine: 'auto' }],
      },
    },
  ],
};
