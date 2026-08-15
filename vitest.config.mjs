import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const baseSrc = path.join(__dirname, 'packages/base/src')
const stubSiteConfig = path.join(__dirname, 'tests/fixtures/stub-site-config.js')
const defaultSiteSrc = path.join(__dirname, 'sites/sauvage-watches/src')

// Le flag `--no-experimental-webstorage` n'existe que depuis Node 22.4 (arrivée
// du `localStorage` natif). Le passer aux workers Vitest sur une version
// antérieure fait planter chaque fork au démarrage (« Worker exited
// unexpectedly »), sans qu'aucun test ne tourne. On ne l'ajoute donc que s'il
// est supporté.
const [nodeMajor, nodeMinor] = process.versions.node.split('.').map(Number)
const supportsWebStorageFlag = nodeMajor > 22 || (nodeMajor === 22 && nodeMinor >= 4)
const workerExecArgv = supportsWebStorageFlag ? ['--no-experimental-webstorage'] : []

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
    // On désactive le webstorage natif pour que happy-dom fournisse le sien — mais
    // uniquement sur les versions de Node qui connaissent ce flag (voir plus haut).
    execArgv: workerExecArgv,
  },
  resolve: {
    alias: {
      '@': baseSrc,
      '@site-config': stubSiteConfig,
      '@site': defaultSiteSrc,
    },
  },
})
