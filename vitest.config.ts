import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { WxtVitest } from 'wxt/testing/vitest-plugin'

const root = path.dirname(fileURLToPath(import.meta.url))
const plugins = await WxtVitest()

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      '~tests': path.resolve(root, 'tests'),
    },
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/.wxt/**', '**/.output/**'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/**/*.{test,spec}.ts', 'src/**/testing/**'],
    },
  },
})
