import { test, expect } from '@playwright/test'

import { installCheckoutMocks, stubSupabase, seedBrowser } from './support/mocks.js'
import { SAMPLE_WATCH } from './support/fixtures.js'

/**
 * Tunnel d'achat — de la commande draft (depuis le panier) jusqu'au montant
 * final débloqué. Le montage réel du Payment Element Stripe est hors périmètre
 * (nécessiterait js.stripe.com) : on vérifie le tunnel jusqu'au montant à payer.
 */
test.describe('Tunnel d’achat — checkout', () => {
  test('crée la commande draft et affiche le récapitulatif du panier', async ({ page }) => {
    const backend = await installCheckoutMocks(page)

    await page.goto('/checkout')

    // Récapitulatif : la ligne produit issue du panier.
    await expect(page.getByText(SAMPLE_WATCH.name)).toBeVisible()
    await expect(page.getByText(`Réf. ${SAMPLE_WATCH.reference}`)).toBeVisible()

    // Sous-total = prix unitaire (3 490,00 €).
    const summary = page.locator('aside').filter({ hasText: 'Sous-total' })
    await expect(summary).toContainText('490,00')

    // Tant que la livraison n'est pas renseignée, le montant final est masqué.
    await expect(
      page.getByText('Complétez vos informations de livraison pour afficher le montant final.'),
    ).toBeVisible()

    // La commande draft a bien été créée côté « backend ».
    expect(backend.calls).toContain('POST /api/orders')
    expect(backend.state.order?.status).toBe('draft')
  })

  test('complète contact + livraison et débloque le montant à payer', async ({ page }) => {
    const backend = await installCheckoutMocks(page)
    await page.goto('/checkout')
    await expect(page.getByText(SAMPLE_WATCH.name)).toBeVisible()

    // Contact
    await page.getByPlaceholder('Adresse e-mail').fill('acheteur@example.com')
    await page.getByPlaceholder('Jean').fill('Camille')
    await page.getByPlaceholder('Dupont').fill('Martin')

    // Adresse d'expédition (pays FR par défaut)
    await page.getByPlaceholder('12 rue de la Paix').fill('32 Allée de la Robertsau')
    await page.getByPlaceholder('75001').fill('67000')
    await page.getByPlaceholder('Paris').fill('Strasbourg')

    // Mode d'expédition
    await page.getByText('Livraison assurée à domicile').click()

    // Le montant final se débloque : le message d'attente disparaît…
    await expect(
      page.getByText('Complétez vos informations de livraison pour afficher le montant final.'),
    ).toBeHidden()

    // …et le bouton de paiement affiche le total.
    const payButton = page.getByRole('button', { name: /Payer/ })
    await expect(payButton).toContainText('490,00')

    // La livraison Colissimo est gratuite dans la config Sauvage.
    const summary = page.locator('aside').filter({ hasText: 'Sous-total' })
    await expect(summary).toContainText('Gratuite')

    // Le tunnel a synchronisé la commande côté backend.
    await expect
      .poll(() => backend.calls.some((c) => c.endsWith('/customer')))
      .toBe(true)
    await expect
      .poll(() => backend.calls.some((c) => c.endsWith('/shipping')))
      .toBe(true)
    expect(backend.state.order?.customerEmail).toBe('acheteur@example.com')
  })

  test('applique un code promo et met à jour le total', async ({ page }) => {
    await installCheckoutMocks(page)
    await page.goto('/checkout')
    await expect(page.getByText(SAMPLE_WATCH.name)).toBeVisible()

    const summary = page.locator('aside').filter({ hasText: 'Sous-total' })
    await summary.getByPlaceholder('Code promo').fill('E2E10')
    await summary.getByRole('button', { name: 'Valider' }).click()

    // Remise de 10 % appliquée : le bouton « Retirer le code » apparaît.
    await expect(summary.getByRole('button', { name: 'Retirer le code' })).toBeVisible()
    // 10 % de 3 490,00 € = 349,00 € de remise.
    await expect(summary).toContainText('349,00')
  })

  test('permet le retrait en boutique plutôt que la livraison', async ({ page }) => {
    await installCheckoutMocks(page)
    await page.goto('/checkout')
    await expect(page.getByText(SAMPLE_WATCH.name)).toBeVisible()

    // Bascule vers le mode retrait.
    await page.getByRole('button', { name: 'Retrait' }).click()

    // La carte du point de retrait s'affiche (config Sauvage — Robertsau).
    await expect(page.getByText('32 Allée de la Robertsau, 67000 Strasbourg')).toBeVisible()

    // Contact + adresse de facturation requise pour le retrait.
    await page.getByPlaceholder('Adresse e-mail').fill('acheteur@example.com')
    await page.getByPlaceholder('Jean').fill('Camille')
    await page.getByPlaceholder('Dupont').fill('Martin')
    await page.getByPlaceholder('12 rue de la Paix').fill('32 Allée de la Robertsau')
    await page.getByPlaceholder('75001').fill('67000')
    await page.getByPlaceholder('Paris').fill('Strasbourg')

    // Le montant final se débloque.
    await expect(
      page.getByText('Complétez vos informations de livraison pour afficher le montant final.'),
    ).toBeHidden()
    await expect(page.getByRole('button', { name: /Payer/ })).toContainText('490,00')
  })

  test('un panier vide renvoie vers la collection', async ({ page }) => {
    // Pas de backend commandes : createOrderFromCart doit court-circuiter avant.
    await seedBrowser(page, { cartLines: [] })
    await stubSupabase(page)

    await page.goto('/checkout')

    await expect(page).toHaveURL(/\/collection$/)
  })
})
