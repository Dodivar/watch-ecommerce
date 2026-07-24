import { test, expect } from '@playwright/test'

import { seedBrowser, stubSupabaseCatalog, mockOrderBackend } from './support/mocks.js'
import {
  SAMPLE_WATCH,
  SECOND_WATCH,
  SAMPLE_WATCH_SLUG,
  cartLineFromWatch,
} from './support/fixtures.js'

/**
 * Intégrité du panier — l'un des parcours les plus critiques d'un e-commerce :
 * un panier qui ne se met pas à jour (retrait d'article, total, persistance)
 * fait perdre la vente ou facture le mauvais montant.
 *
 * En desktop, le tiroir n'a pas de bouton d'ouverture dans l'en-tête ; on
 * l'ouvre via « Ajouter au panier » depuis la fiche produit (comportement réel).
 */
test.describe('Gestion du panier — intégrité', () => {
  test('retire des articles du tiroir et met à jour le total', async ({ page }) => {
    await seedBrowser(page, {
      cartLines: [cartLineFromWatch(SAMPLE_WATCH), cartLineFromWatch(SECOND_WATCH)],
    })
    await stubSupabaseCatalog(page, { watches: [SAMPLE_WATCH, SECOND_WATCH] })
    await mockOrderBackend(page, { watches: [SAMPLE_WATCH, SECOND_WATCH] })

    // Ouvre le tiroir depuis la fiche produit (le 1er article est déjà au panier,
    // l'ajout est idempotent pour ce catalogue mono-quantité).
    await page.goto(`/montre/${SAMPLE_WATCH_SLUG}`)
    await expect(
      page.getByRole('heading', { level: 1, name: SAMPLE_WATCH.name }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Ajouter au panier' }).first().click()

    const drawer = page.getByLabel('Mon panier')
    await expect(drawer.getByText('2 articles')).toBeVisible()
    await expect(drawer.getByText(SAMPLE_WATCH.name)).toBeVisible()
    await expect(drawer.getByText(SECOND_WATCH.name)).toBeVisible()
    // Total = 3 490,00 € + 5 200,00 € = 8 690,00 €.
    await expect(drawer).toContainText('690,00')

    // Retire le premier article : le compteur, la ligne et le total suivent.
    await drawer.getByRole('button', { name: `Retirer ${SAMPLE_WATCH.name}` }).click()
    await expect(drawer.getByText('1 article', { exact: true })).toBeVisible()
    await expect(drawer.getByText(SAMPLE_WATCH.name)).toHaveCount(0)
    await expect(drawer.getByText(SECOND_WATCH.name)).toBeVisible()
    // Total restant = 5 200,00 €.
    await expect(drawer).toContainText('200,00')

    // Retire le dernier article : panier vide, commande impossible.
    await drawer.getByRole('button', { name: `Retirer ${SECOND_WATCH.name}` }).click()
    await expect(drawer.getByText('Votre panier est vide.')).toBeVisible()
    await expect(drawer.getByRole('button', { name: 'Commander' })).toBeDisabled()
  })

  test('conserve le panier après un rechargement de page', async ({ page }) => {
    await seedBrowser(page, { cartLines: [cartLineFromWatch(SAMPLE_WATCH)] })
    await stubSupabaseCatalog(page, { watches: [SAMPLE_WATCH] })
    await mockOrderBackend(page, { watches: [SAMPLE_WATCH] })

    await page.goto(`/montre/${SAMPLE_WATCH_SLUG}`)
    await page.getByRole('button', { name: 'Ajouter au panier' }).first().click()
    await expect(page.getByLabel('Mon panier').getByText('1 article', { exact: false })).toBeVisible()

    // Recharge la page : le panier persiste (localStorage), rien n'est perdu.
    await page.reload()
    await expect(
      page.getByRole('heading', { level: 1, name: SAMPLE_WATCH.name }),
    ).toBeVisible()

    // Rouvre le tiroir : l'article est toujours là.
    await page.getByRole('button', { name: 'Ajouter au panier' }).first().click()
    const drawer = page.getByLabel('Mon panier')
    await expect(drawer.getByText('1 article', { exact: false })).toBeVisible()
    await expect(drawer.getByText(`Réf. ${SAMPLE_WATCH.reference}`)).toBeVisible()
  })
})
