import { test, expect } from '@playwright/test'

import { seedBrowser, stubSupabase, mockOrderBackend } from './support/mocks.js'

/**
 * Pages de retour de paiement (après redirection Stripe) :
 * confirmation `/commande/succes` et annulation `/commande/annulee`.
 */
test.describe('Retour de paiement', () => {
  test('confirmation de commande après un paiement vérifié', async ({ page }) => {
    await seedBrowser(page, { cartLines: [] })
    await stubSupabase(page)
    await mockOrderBackend(page)

    await page.goto('/commande/succes?order=e2e-order-001&token=valid-token')

    await expect(page.getByRole('heading', { name: 'Paiement réussi' })).toBeVisible()
    await expect(page.getByText('Merci pour votre commande.')).toBeVisible()
    await expect(page.getByText('e2e-order-001')).toBeVisible()
    await expect(page.getByText('acheteur@example.com')).toBeVisible()
  })

  test('un lien de confirmation invalide renvoie vers la collection', async ({ page }) => {
    await seedBrowser(page, { cartLines: [] })
    await stubSupabase(page)
    // Le garde de route appelle verifyOrder : réponse invalide → redirection.
    await mockOrderBackend(page, { verify: { valid: false, reason: 'Paiement non confirmé' } })

    await page.goto('/commande/succes?order=e2e-order-001&token=bad-token')

    await expect(page).toHaveURL(/\/collection$/)
  })

  test('annulation : la réservation est libérée', async ({ page }) => {
    await seedBrowser(page, { cartLines: [] })
    await stubSupabase(page)
    const backend = await mockOrderBackend(page)

    await page.goto('/commande/annulee?order=e2e-order-001&token=valid-token')

    await expect(page.getByRole('heading', { name: 'Commande annulée' })).toBeVisible()
    await expect(page.getByText('Votre réservation a été libérée.')).toBeVisible()
    await expect
      .poll(() => backend.calls.some((c) => c.endsWith('/cancel')))
      .toBe(true)
  })
})
