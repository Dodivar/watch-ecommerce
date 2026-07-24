import { test, expect } from '@playwright/test'

import { seedBrowser, stubSupabaseCatalog, mockOrderBackend } from './support/mocks.js'
import { SAMPLE_WATCH, SAMPLE_WATCH_SLUG } from './support/fixtures.js'

/**
 * Entrée du tunnel d'achat : depuis la fiche produit, ajout au panier puis
 * bascule vers le checkout. Le catalogue Supabase est simulé (voir
 * stubSupabaseCatalog), aucune base réelle n'est requise.
 */
test.describe('Fiche produit → panier → checkout', () => {
  test('ajoute une montre au panier depuis la fiche produit', async ({ page }) => {
    await seedBrowser(page, { cartLines: [] })
    await stubSupabaseCatalog(page)
    await mockOrderBackend(page)

    await page.goto(`/montre/${SAMPLE_WATCH_SLUG}`)

    // La fiche produit se charge depuis le catalogue simulé.
    await expect(page.getByRole('heading', { level: 1, name: SAMPLE_WATCH.name })).toBeVisible()

    // Ajout au panier → le tiroir s'ouvre avec l'article.
    await page.getByRole('button', { name: 'Ajouter au panier' }).first().click()
    const drawer = page.getByLabel('Mon panier')
    await expect(drawer.getByText('1 article', { exact: false })).toBeVisible()
    await expect(drawer.getByText(`Réf. ${SAMPLE_WATCH.reference}`)).toBeVisible()
  })

  test('poursuit du panier vers le checkout avec la montre ajoutée', async ({ page }) => {
    await seedBrowser(page, { cartLines: [] })
    await stubSupabaseCatalog(page)
    const backend = await mockOrderBackend(page)

    await page.goto(`/montre/${SAMPLE_WATCH_SLUG}`)
    await expect(page.getByRole('heading', { level: 1, name: SAMPLE_WATCH.name })).toBeVisible()
    await page.getByRole('button', { name: 'Ajouter au panier' }).first().click()

    // « Commander » depuis le tiroir → page checkout.
    await page.getByRole('button', { name: 'Commander' }).click()
    await expect(page).toHaveURL(/\/checkout$/)

    // La commande draft reprend bien l'article du panier.
    await expect(page.getByText(SAMPLE_WATCH.name)).toBeVisible()
    await expect.poll(() => backend.calls.includes('POST /api/orders')).toBe(true)
    expect(backend.state.order?.lines?.[0]?.watchId).toBe(SAMPLE_WATCH.watchId)
  })
})
