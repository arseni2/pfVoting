import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    exclude: ['node_modules', 'dist'],
    include: ['src/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
  },
})