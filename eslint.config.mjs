import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import tailwindPlugin from 'eslint-plugin-tailwindcss'
import prettierConfig from 'eslint-config-prettier'
import reactCompilerPlugin from 'eslint-plugin-react-compiler'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
  {
    plugins: { tailwindcss: tailwindPlugin },
    ignores: ['src/components/ui/**'],
    settings: {
      tailwindcss: {
        config: {},
        cssFiles: ['./src/app/globals.css'],
        whitelist: ['adsbygoogle'],
      },
    },
    rules: {
      ...tailwindPlugin.configs.recommended.rules,
      'tailwindcss/no-custom-classname': 'off',
    },
  },
  {
    plugins: {
      'react-compiler': reactCompilerPlugin,
    },
    rules: {
      'no-unneeded-ternary': 'error',
      'no-process-env': 'error',
      indent: 'off',
      'no-console': 'error',
      'react/no-danger': 'error',
      'react/prefer-stateless-function': 'error',
      'react/no-unused-prop-types': 'error',
      'react/no-unescaped-entities': 'error',
      'react/no-unknown-property': ['error', { ignore: ['css', 'fetchpriority'] }],
      'react/no-deprecated': 'error',
      'react-hooks/rules-of-hooks': 'error',
      '@typescript-eslint/no-var-requires': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'import/no-default-export': 'error',
      'import/prefer-default-export': 'off',
      'react-compiler/react-compiler': 'error',
      '@next/next/no-html-link-for-pages': 'error',
    },
  },
  {
    // Next.js app router files require default exports
    files: [
      'src/app/**/page.tsx',
      'src/app/**/layout.tsx',
      'src/app/**/error.tsx',
      'src/app/**/loading.tsx',
      'src/app/**/not-found.tsx',
      'src/app/**/template.tsx',
      'src/app/**/route.ts',
      'src/app/**/robots.ts',
      'src/app/**/sitemap.ts',
    ],
    rules: {
      'import/no-default-export': 'off',
    },
  },
  {
    // Framework config files legitimately use default exports and process.env
    files: ['*.config.mjs', '*.config.ts', '*.config.js', '*.config.cjs'],
    rules: {
      'import/no-default-export': 'off',
      'no-process-env': 'off',
    },
  },
  {
    // Env modules are the designated boundary for process.env access
    files: ['src/lib/env.*.ts'],
    rules: {
      'no-process-env': 'off',
    },
  },
  {
    // Logger is the designated boundary for console output
    files: ['src/utils/logger.ts'],
    rules: {
      'no-console': 'off',
      'no-process-env': 'off',
    },
  },
  {
    // JSON-LD components inject internally generated structured data, not user input
    files: ['src/components/seo/**/*.tsx'],
    rules: {
      'react/no-danger': 'off',
    },
  },
  prettierConfig,
])

export default eslintConfig
