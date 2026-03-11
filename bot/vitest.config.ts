import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    exclude: ['node_modules', 'dist'],
    include: ['src/tests/**/*.{test,spec}.?(c|m)[jt]s?(x)', 'src/**/*.test.ts'],
  },
})