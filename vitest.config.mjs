import path from 'node:path'
import { fileURLToPath } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const baseSrc = path.join(__dirname, 'packages/base/src')
const stubSiteConfig = path.join(__dirname, 'tests/fixtures/stub-site-config.js')
const defaultSiteSrc = path.join(__dirname, 'sites/sauvage-watches/src')

export default defineConfig({
  plugins: [vue()],
  test: {
    include: ['packages/base/**/*.test.js', 'tests/**/*.test.js'],
    environment: 'node',
    environmentMatchGlobs: [
      ['packages/base/**/*.component.test.js', 'happy-dom'],
      ['**/*.component.test.js', 'happy-dom'],
    ],
  },
  resolve: {
    alias: {
      '@': baseSrc,
      '@site-config': stubSiteConfig,
      '@site': defaultSiteSrc,
    },
  },
})
