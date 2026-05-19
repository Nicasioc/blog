import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import tailwindPlugin from 'eslint-plugin-tailwindcss'
import prettierConfig from 'eslint-config-prettier'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
  {
    plugins: { tailwindcss: tailwindPlugin },
    ignores: ['src/components/ui/**'],
    rules: {
      ...tailwindPlugin.configs.recommended.rules,
      'tailwindcss/no-custom-classname': 'warn',
    },
  },
  prettierConfig,
])

export default eslintConfig
