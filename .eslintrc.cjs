/**
 * Root ESLint config. Individual packages/apps extend this.
 * Enforces: strict TS, no relative-import escapes across package boundaries
 * (public entry points only - see docs/architecture/overview.md "Boundary rule").
 */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2020, sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  env: { browser: true, es2021: true, node: true, jest: true },
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/consistent-type-imports': 'warn',
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['**/apps/*/src/**', '!**/apps/operations-remote/src/**'],
            message: 'Remotes and shell must not import another remote internal src. Use platform-contracts / exposed modules only.'
          }
        ]
      }
    ]
  },
  ignorePatterns: ['dist', 'dist-rsbuild', 'build', 'node_modules']
};
