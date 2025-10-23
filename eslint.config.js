// Flat ESLint config for ESLint v9+
// Covers TypeScript + React (hooks) for both frontend and backend
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'server/dist/**',
      'packages/**',
      // generated artifacts we don't lint
      'index-*.js',
      'index-*.css',
      'react-vendors-*.js',
      'ui-vendors-*.js',
      'chart-vendors-*.js',
      'icons-*.js',
      'utils-*.js',
    ],
  },
  // Project rules
  {
    files: ['**/*.{ts,tsx,js}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        // Vitest globals
        ...globals.jest,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    extends: [
      js.configs.recommended,
      // TypeScript recommended rules (no type-checking required)
      ...tseslint.configs.recommended,
    ],
    rules: {
      // React hooks best practices
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'off',
      // Helpful during dev to avoid HMR issues
      'react-refresh/only-export-components': 'off',
      // Keep console in dev; drop in prod via terser
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      // Reduce noise; allow incremental tightening later
      '@typescript-eslint/no-explicit-any': 'off',
  '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  // Allow require() in Node entry files
  {
    files: ['app.js', 'app.cjs', 'server/**/*.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
)
