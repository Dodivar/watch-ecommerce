import { defineConfig, devices } from '@playwright/test'

/**
 * Tests d'intégration end-to-end (Playwright).
 *
 * Périmètre : le tunnel d'achat (fiche produit → panier → checkout → retour
 * paiement). Les tests sont hermétiques — le storefront tourne en dev Vite avec
 * des variables Supabase/Stripe factices, et tous les appels réseau (Supabase,
 * API commandes) sont interceptés côté navigateur (voir tests/e2e/support).
 *
 * Deux vitrines sont couvertes, chacune avec son propre serveur de dev :
 * - `sauvage-watches` (défaut) sur E2E_PORT
 * - `place-des-montres` (panier multi-quantité) sur E2E_PORT_PLACE
 */

const PORT = Number(process.env.E2E_PORT || 5173)
const PORT_PLACE = Number(process.env.E2E_PORT_PLACE || 5174)
const BASE_URL = `http://localhost:${PORT}`
const BASE_URL_PLACE = `http://localhost:${PORT_PLACE}`

const STUB_ENV = {
  // Valeurs factices : le client Supabase exige ces variables au démarrage,
  // mais tout le trafic réseau est intercepté dans les tests.
  VITE_SUPABASE_URL: 'https://stub.supabase.test',
  VITE_SUPABASE_ANON_KEY: 'e2e-anon-key',
  // Clé Stripe laissée vide : le tunnel est vérifié jusqu'au montant final,
  // sans monter le Payment Element (qui nécessiterait js.stripe.com).
  VITE_STRIPE_PUBLISHABLE_KEY: '',
}

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.js',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 30_000,
  expect: { timeout: 7_000 },

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'sauvage-watches',
      testIgnore: '**/place-des-montres/**',
      use: { ...devices['Desktop Chrome'], baseURL: BASE_URL },
    },
    {
      name: 'place-des-montres',
      testMatch: '**/place-des-montres/**/*.spec.js',
      use: { ...devices['Desktop Chrome'], baseURL: BASE_URL_PLACE },
    },
  ],

  webServer: [
    {
      command: `npm run dev -- --port ${PORT} --strictPort`,
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { ...STUB_ENV },
    },
    {
      command: `npm run dev -- --port ${PORT_PLACE} --strictPort`,
      url: BASE_URL_PLACE,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { ...STUB_ENV, SITE_ID: 'place-des-montres' },
    },
  ],
})
