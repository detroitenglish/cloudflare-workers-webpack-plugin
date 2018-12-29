module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],
  parser: 'babel-eslint',
  parserOptions: {
    allowImportExportEverywhere: true,
    ecmaVersion: 9,
    parser: 'babel-eslint',
    sourceType: 'module',
  },
  plugins: ['prettier', 'babel'],
  root: true,
  rules: {
    'no-console': 'off',
    'no-useless-escape': 'warn',
    'no-var': 'error',
    'prettier/prettier': [
      'error',
      {},
      {
        usePrettierrc: true,
      },
    ],
    'require-await': 'error',
  },
}
