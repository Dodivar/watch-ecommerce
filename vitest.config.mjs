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
    // Valeurs factices : certains services (ex. supabase.js) exigent ces variables
    // au chargement du module. La CI `npm test` ne fournit pas de .env ; ces stubs
    // gardent la suite hermétique sans appel réseau.
    env: {
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    },
    environment: 'node',
    // Node ≥ 22.4 expose un `localStorage` natif (undefined sans --localstorage-file)
    // qui masque celui de happy-dom : Vitest ne remplace pas les globaux déjà présents.
    // On désactive le webstorage natif pour que happy-dom fournisse le sien.
    execArgv: ['--no-experimental-webstorage'],
  },
  resolve: {
    alias: {
      '@': baseSrc,
      '@site-config': stubSiteConfig,
      '@site': defaultSiteSrc,
    },
  },
})
