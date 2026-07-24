import { test, expect } from '@playwright/test'

import { seedBrowser, stubSupabaseCatalog, mockOrderBackend } from './support/mocks.js'
import { SOLD_WATCH } from './support/fixtures.js'

/**
 * Garde anti-survente — critique pour un e-commerce de pièces uniques (revente
 * de montres) : une montre déjà vendue reste consultable en archive, mais son
 * achat doit être impossible (aucun bouton « Ajouter au panier »).
 */
test.describe('Disponibilité produit — garde anti-survente', () => {
  test('une montre vendue reste consultable mais ne peut pas être achetée', async ({ page }) => {
    await seedBrowser(page, { cartLines: [] })
    await stubSupabaseCatalog(page, { watches: [SOLD_WATCH] })
    await mockOrderBackend(page, { watches: [SOLD_WATCH] })

    await page.goto(`/montre/${SOLD_WATCH.slug}`)

    // La fiche se charge (archive des ventes).
    await expect(
      page.getByRole('heading', { level: 1, name: SOLD_WATCH.name }),
    ).toBeVisible()

    // Message d'archive affiché…
    await expect(page.getByText('Cette montre a trouvé preneur')).toBeVisible()

    // …et aucun moyen d'ajouter la montre au panier.
    await expect(page.getByRole('button', { name: 'Ajouter au panier' })).toHaveCount(0)
  })
})
