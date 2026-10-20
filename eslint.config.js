import tsParser from '@typescript-eslint/parser'

export default [
  {
    // Apply our custom rules to all src TS/TSX files, using the TS parser
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'process',
          property: 'env',
          message:
            'CF Workers 无 process.env：请用 src/lib/env.ts 的 env。',
        },
      ],
    },
  },
  {
    // The Playwright suite runs in Node, not in the worker: `process.env` is
    // the normal way to configure it, so the ban above does not apply here.
    files: ['e2e/**/*.ts', 'playwright.config.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
      },
    },
  },
  {
    // Never lint generated or built files
    ignores: [
      'dist/**',
      '.wrangler/**',
      'drizzle/**',
      'worker-configuration.d.ts',
      'src/routeTree.gen.ts',
      'node_modules/**',
      'docs/**', // standalone docs app — has its own toolchain
    ],
  },
]
