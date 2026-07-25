import { test, expect } from '@playwright/test'

import { seedBrowser, stubSupabaseCatalog } from './support/mocks.js'
import { SAMPLE_WATCH, SECOND_WATCH } from './support/fixtures.js'

/**
 * Recherche catalogue (`/collection/recherche?q=…`) — porte d'entrée majeure
 * vers la conversion : un moteur qui ne renvoie rien de pertinent (ou plante sur
 * un terme inconnu) coûte des ventes. La correspondance porte sur le nom, la
 * marque, le modèle et la référence (casse et accents ignorés).
 */
test.describe('Recherche catalogue', () => {
  test('affiche les montres correspondant au terme', async ({ page }) => {
    await seedBrowser(page, { cartLines: [] })
    await stubSupabaseCatalog(page, { watches: [SAMPLE_WATCH, SECOND_WATCH] })

    await page.goto('/collection/recherche?q=Explorateur')

    await expect(page.getByRole('heading', { name: /Résultats pour/ })).toBeVisible()
    // Seule la montre « Explorateur » correspond au terme.
    await expect(page.getByText(SECOND_WATCH.name, { exact: true }).first()).toBeVisible()
    await expect(page.getByText(SAMPLE_WATCH.name, { exact: true })).toHaveCount(0)
  })

  test('affiche un état vide pour un terme sans correspondance', async ({ page }) => {
    await seedBrowser(page, { cartLines: [] })
    await stubSupabaseCatalog(page, { watches: [SAMPLE_WATCH, SECOND_WATCH] })

    await page.goto('/collection/recherche?q=Rolex')

    await expect(page.getByRole('heading', { name: 'Aucune montre trouvée' })).toBeVisible()
    await expect(page.getByText(SAMPLE_WATCH.name, { exact: true })).toHaveCount(0)
  })
})
