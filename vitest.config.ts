import { defineConfig } from 'vitest/config'
import { WxtVitest } from 'wxt/testing/vitest-plugin'

const plugins = await WxtVitest()

export default defineConfig({
  plugins,
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['**/node_modules/**', '**/.wxt/**', '**/.output/**'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/**/*.{test,spec}.ts', 'src/**/testing/**'],
    },
  },
})
