import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Global ignores: this block must hold only `ignores`, or it applies to nothing.
  {
    ignores: [
      '**/node_modules',
      '**/dist',
      '**/build',
      '**/.turbo',
      '**/.astro',
      '**/.wrangler',
      '**/coverage',
      '**/*.d.ts',
      '**/*.astro',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  // QA harness: plain .mjs run by Node, plus functions passed to page.evaluate that run in the browser.
  // Globals are listed by hand to avoid adding the `globals` package.
  {
    files: ['tools/qa/**/*.mjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        URL: 'readonly',
        window: 'readonly',
        document: 'readonly',
        getComputedStyle: 'readonly',
        matchMedia: 'readonly',
        NodeFilter: 'readonly',
      },
    },
  }
);
