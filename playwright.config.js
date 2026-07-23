import { defineConfig, devices } from '@playwright/test'

/**
 * Tests d'intégration end-to-end (Playwright).
 *
 * Périmètre actuel : le tunnel d'achat (panier → checkout → paiement).
 * Les tests sont hermétiques — le storefront tourne en dev Vite avec des
 * variables Supabase/Stripe factices, et tous les appels réseau (Supabase,
 * API commandes) sont interceptés côté navigateur (voir tests/e2e/support).
 *
 * Le site testé est `sauvage-watches` (valeur SITE_ID par défaut du dev Vite).
 */

const PORT = Number(process.env.E2E_PORT || 5173)
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.js',
  // Ces tests pilotent un vrai navigateur : on les garde hors de la suite Vitest.
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 30_000,
  expect: { timeout: 7_000 },

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev -- --port ' + PORT + ' --strictPort',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // Valeurs factices : le client Supabase exige ces variables au démarrage,
      // mais tout le trafic réseau est intercepté dans les tests.
      VITE_SUPABASE_URL: 'https://stub.supabase.test',
      VITE_SUPABASE_ANON_KEY: 'e2e-anon-key',
      // Clé Stripe laissée vide : le tunnel est vérifié jusqu'au montant final,
      // sans monter le Payment Element (qui nécessiterait js.stripe.com).
      VITE_STRIPE_PUBLISHABLE_KEY: '',
    },
  },
})
