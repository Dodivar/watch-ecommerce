import { test, expect } from '@playwright/test'

import { installCheckoutMocks } from './support/mocks.js'
import { SAMPLE_WATCH } from './support/fixtures.js'

/**
 * Codes promo lors d'un achat — bloc « Récapitulatif » du checkout.
 *
 * Périmètre : la saisie d'un code promo pendant le tunnel, sa validation par le
 * « backend commandes » simulé (POST /api/orders/:id/promo) et la répercussion
 * de la remise sur le récapitulatif puis sur le montant à payer. Les règles du
 * backend simulé reflètent `backend/orders/promo.js` : remise en pourcentage,
 * remise fixe, plafond, sous-total minimum, code inconnu/désactivé.
 *
 * Rappel des montants : SAMPLE_WATCH = 3 490,00 € (sous-total du panier).
 */
test.describe('Tunnel d’achat — codes promo', () => {
  /** Ouvre le checkout et renvoie le locator du récapitulatif (aside). */
  async function openCheckout(page) {
    const backend = await installCheckoutMocks(page)
    await page.goto('/checkout')
    await expect(page.getByText(SAMPLE_WATCH.name)).toBeVisible()
    const summary = page.locator('aside').filter({ hasText: 'Sous-total' })
    return { backend, summary }
  }

  /** Applique un code via le champ « Code promo ». */
  async function applyCode(summary, code) {
    await summary.getByPlaceholder('Code promo').fill(code)
    await summary.getByRole('button', { name: 'Valider' }).click()
  }

  test('applique une remise en pourcentage et met à jour le total', async ({ page }) => {
    const { backend, summary } = await openCheckout(page)

    await applyCode(summary, 'E2E10')

    // Message de succès + ligne « Remise ».
    await expect(summary.getByText('Code appliqué')).toBeVisible()
    const remise = summary.locator('div').filter({ hasText: /^Remise/ })
    await expect(remise).toContainText('349,00') // 10 % de 3 490,00 €

    // Total = 3 490,00 − 349,00 = 3 141,00 €.
    const total = summary.locator('div').filter({ hasText: /^Total/ })
    await expect(total).toContainText('141,00')

    // Le bouton de retrait apparaît, et le backend a enregistré la remise.
    await expect(summary.getByRole('button', { name: 'Retirer le code' })).toBeVisible()
    await expect.poll(() => backend.state.order?.discountCents).toBe(34_900)
    expect(backend.state.order?.promoCode).toBe('E2E10')
  })

  test('applique une remise en montant fixe', async ({ page }) => {
    const { backend, summary } = await openCheckout(page)

    await applyCode(summary, 'E2E50')

    const remise = summary.locator('div').filter({ hasText: /^Remise/ })
    await expect(remise).toContainText('50,00')
    // Total = 3 490,00 − 50,00 = 3 440,00 €.
    const total = summary.locator('div').filter({ hasText: /^Total/ })
    await expect(total).toContainText('440,00')
    await expect.poll(() => backend.state.order?.discountCents).toBe(5_000)
  })

  test('plafonne une remise en pourcentage au maximum configuré', async ({ page }) => {
    const { backend, summary } = await openCheckout(page)

    // E2ECAP = 20 % (soit 698,00 €) mais plafonné à 200,00 €.
    await applyCode(summary, 'E2ECAP')

    const remise = summary.locator('div').filter({ hasText: /^Remise/ })
    await expect(remise).toContainText('200,00')
    // Total = 3 490,00 − 200,00 = 3 290,00 €.
    const total = summary.locator('div').filter({ hasText: /^Total/ })
    await expect(total).toContainText('290,00')
    await expect.poll(() => backend.state.order?.discountCents).toBe(20_000)
  })

  test('refuse un code inconnu sans appliquer de remise', async ({ page }) => {
    const { backend, summary } = await openCheckout(page)

    await applyCode(summary, 'NIMPORTEQUOI')

    // Message d'erreur, aucune ligne « Remise », aucun bouton de retrait.
    await expect(summary.getByText("Ce code promo n'existe pas")).toBeVisible()
    await expect(summary.getByText('Remise', { exact: true })).toBeHidden()
    await expect(summary.getByRole('button', { name: 'Retirer le code' })).toBeHidden()

    // Total inchangé (3 490,00 €) et aucune remise côté backend.
    const total = summary.locator('div').filter({ hasText: /^Total/ })
    await expect(total).toContainText('490,00')
    expect(backend.state.order?.discountCents).toBe(0)
  })

  test('refuse un code désactivé', async ({ page }) => {
    const { backend, summary } = await openCheckout(page)

    await applyCode(summary, 'E2EOFF')

    await expect(summary.getByText('Code promo invalide')).toBeVisible()
    await expect(summary.getByRole('button', { name: 'Retirer le code' })).toBeHidden()
    expect(backend.state.order?.discountCents).toBe(0)
  })

  test('rejette un code sous condition de sous-total minimum non atteint', async ({ page }) => {
    const { backend, summary } = await openCheckout(page)

    // E2EVIP exige 5 000,00 € de sous-total ; le panier n'en fait que 3 490,00 €.
    await applyCode(summary, 'E2EVIP')

    await expect(summary.getByText('Code promo invalide')).toBeVisible()
    await expect(summary.getByRole('button', { name: 'Retirer le code' })).toBeHidden()
    expect(backend.state.order?.discountCents).toBe(0)
  })

  test('signale un champ vide sans appeler le backend', async ({ page }) => {
    const { backend, summary } = await openCheckout(page)

    // Clic sur « Valider » sans rien saisir : validation côté client uniquement.
    await summary.getByRole('button', { name: 'Valider' }).click()

    await expect(summary.getByText('Saisissez un code promo')).toBeVisible()
    expect(backend.calls.filter((c) => c.endsWith('/promo'))).toHaveLength(0)
  })

  test('applique puis retire un code, restaurant le total initial', async ({ page }) => {
    const { backend, summary } = await openCheckout(page)

    await applyCode(summary, 'E2E10')
    await expect(summary.getByRole('button', { name: 'Retirer le code' })).toBeVisible()
    await expect.poll(() => backend.state.order?.discountCents).toBe(34_900)

    // Retrait du code.
    await summary.getByRole('button', { name: 'Retirer le code' }).click()

    // La ligne « Remise » et le bouton de retrait disparaissent, le champ est vidé.
    await expect(summary.getByText('Remise', { exact: true })).toBeHidden()
    await expect(summary.getByRole('button', { name: 'Retirer le code' })).toBeHidden()
    await expect(summary.getByPlaceholder('Code promo')).toHaveValue('')

    // Total restauré à 3 490,00 € et remise annulée côté backend.
    const total = summary.locator('div').filter({ hasText: /^Total/ })
    await expect(total).toContainText('490,00')
    await expect.poll(() => backend.state.order?.discountCents).toBe(0)
    expect(backend.calls.filter((c) => c.endsWith('/promo')).length).toBeGreaterThanOrEqual(2)
  })

  test('répercute la remise sur le montant à payer après la livraison', async ({ page }) => {
    const { summary } = await openCheckout(page)

    // Remise appliquée avant de renseigner la livraison.
    await applyCode(summary, 'E2E10')
    await expect(summary.getByRole('button', { name: 'Retirer le code' })).toBeVisible()

    // Contact + adresse d'expédition.
    await page.getByPlaceholder('Adresse e-mail').fill('acheteur@example.com')
    await page.getByPlaceholder('Jean').fill('Camille')
    await page.getByPlaceholder('Dupont').fill('Martin')
    await page.getByPlaceholder('12 rue de la Paix').fill('32 Allée de la Robertsau')
    await page.getByPlaceholder('75001').fill('67000')
    await page.getByPlaceholder('Paris').fill('Strasbourg')
    await page.getByText('Livraison assurée à domicile').click()

    // Le montant à payer reflète la remise : 3 141,00 € (livraison gratuite).
    const payButton = page.getByRole('button', { name: /Payer/ })
    await expect(payButton).toContainText('141,00')
  })

  test('un code appliqué survit au rechargement de la page', async ({ page }) => {
    const { backend, summary } = await openCheckout(page)

    await applyCode(summary, 'E2E10')
    await expect.poll(() => backend.state.order?.discountCents).toBe(34_900)

    // Rechargement : la commande draft est relue (GET) et la remise persiste.
    await page.reload()

    const summaryAfter = page.locator('aside').filter({ hasText: 'Sous-total' })
    const remise = summaryAfter.locator('div').filter({ hasText: /^Remise/ })
    await expect(remise).toContainText('349,00')
    await expect(summaryAfter.getByRole('button', { name: 'Retirer le code' })).toBeVisible()
  })
})
