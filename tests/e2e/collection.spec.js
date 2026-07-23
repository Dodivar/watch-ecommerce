import { test, expect } from '@playwright/test'

import { seedBrowser, stubSupabaseCatalog } from './support/mocks.js'
import { SAMPLE_WATCH, SAMPLE_WATCH_SLUG } from './support/fixtures.js'

/**
 * Page collection : grille de montres issue du catalogue simulé, puis
 * navigation vers la fiche produit au clic sur une carte.
 */
test.describe('Collection → fiche produit', () => {
  test('affiche la grille et ouvre la fiche au clic sur une carte', async ({ page }) => {
    await seedBrowser(page, { cartLines: [] })
    await stubSupabaseCatalog(page)

    await page.goto('/collection')

    // La carte de la montre apparaît dans la grille.
    const card = page.getByText(SAMPLE_WATCH.name, { exact: true }).first()
    await expect(card).toBeVisible()

    // Clic sur la carte → fiche produit canonique.
    await card.click()
    await expect(page).toHaveURL(new RegExp(`/montre/${SAMPLE_WATCH_SLUG}$`))
    await expect(
      page.getByRole('heading', { level: 1, name: SAMPLE_WATCH.name }),
    ).toBeVisible()
  })
})
