import { test, expect } from '@playwright/test'

import { seedBrowser, stubSupabaseCatalog } from '../support/mocks.js'
import { SAMPLE_WATCH, SAMPLE_WATCH_SLUG } from '../support/fixtures.js'

/**
 * Vitrine `place-des-montres` : panier multi-quantité (`cartMultiQuantity`).
 * Sert aussi de couverture « autre SITE_ID » (config distincte de Sauvage).
 * Le serveur de dev dédié est démarré par le webServer Playwright (port 5174).
 */
const SITE_ID = 'place-des-montres'

test.describe('Panier multi-quantité (place-des-montres)', () => {
  test('ajoute puis augmente la quantité d’un article dans le tiroir', async ({ page }) => {
    await seedBrowser(page, { cartLines: [], siteId: SITE_ID })
    await stubSupabaseCatalog(page)

    await page.goto(`/montre/${SAMPLE_WATCH_SLUG}`)
    await expect(
      page.getByRole('heading', { level: 1, name: SAMPLE_WATCH.name }),
    ).toBeVisible()

    // Ajout au panier → tiroir ouvert avec les commandes de quantité (feature).
    await page.getByRole('button', { name: 'Ajouter au panier' }).first().click()
    const drawer = page.getByLabel('Mon panier')
    await expect(drawer.getByText('1 article', { exact: false })).toBeVisible()

    // Augmente la quantité à 2.
    await drawer.getByRole('button', { name: 'Augmenter la quantité' }).click()

    // Le compteur d’unités et le sous-total de ligne reflètent 2 exemplaires.
    await expect(drawer.getByText('2 articles', { exact: false })).toBeVisible()
    await expect(drawer.getByText('× 2')).toBeVisible()
  })
})
