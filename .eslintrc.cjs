module.exports = {
  root: true,
  ignorePatterns: ['dist/', 'node_modules/', '*.min.js'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh'],
  env: { browser: true, es2022: true, node: true },
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
  extends: ['eslint:recommended', 'plugin:react-hooks/recommended'],
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    'react-refresh/only-export-components': 'off',
  },
};