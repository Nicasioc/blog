import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    globals: true,
    exclude: ['**/node_modules/**'],
    coverage: {
      provider: 'v8',
      include: ['src/domain/**', 'src/utils/**', 'src/application/**'],
      exclude: ['src/components/ui/**'],
    },
  },
  resolve: {
    alias: { '@': resolve(__dirname, './src') },
  },
})
