import { test, expect } from '@playwright/test'

import { seedBrowser, stubSupabaseCatalog, mockOrderBackend } from './support/mocks.js'
import { SAMPLE_WATCH, SAMPLE_WATCH_SLUG } from './support/fixtures.js'

/**
 * Mesure du tunnel d'achat.
 *
 * Aucun identifiant de mesure n'est configuré en E2E (voir STUB_ENV) : gtag.js n'est donc
 * jamais chargé, mais la couche `services/analytics` pousse quand même ses événements dans
 * `window.dataLayer`. C'est exactement ce que gtag.js consommerait — de quoi vérifier les
 * noms d'événements et les montants sans dépendre de Google.
 */

/** Événements poussés dans `dataLayer` (les commandes `consent` / `config` sont écartées). */
async function trackedEvents(page) {
  return page.evaluate(() =>
    (window.dataLayer || [])
      .map((entry) => Array.from(entry))
      .filter((args) => args[0] === 'event')
      .map((args) => ({ name: args[1], params: args[2] })),
  )
}

async function eventNames(page) {
  return (await trackedEvents(page)).map((event) => event.name)
}

test.describe('Événements e-commerce', () => {
  test('suit la fiche produit, l’ajout au panier et le départ au checkout', async ({ page }) => {
    await seedBrowser(page, { cartLines: [], consent: { analytics: true, marketing: true } })
    await stubSupabaseCatalog(page)
    await mockOrderBackend(page)

    await page.goto(`/montre/${SAMPLE_WATCH_SLUG}`)
    await expect(page.getByRole('heading', { level: 1, name: SAMPLE_WATCH.name })).toBeVisible()

    // Consultation de la fiche.
    await expect.poll(() => eventNames(page)).toContain('view_item')
    const viewItem = (await trackedEvents(page)).find((e) => e.name === 'view_item')
    expect(viewItem.params.items[0]).toMatchObject({
      item_id: SAMPLE_WATCH.reference,
      item_name: SAMPLE_WATCH.name,
      price: SAMPLE_WATCH.price,
    })

    // Ajout au panier — puis ouverture automatique du tiroir.
    await page.getByRole('button', { name: 'Ajouter au panier' }).first().click()
    await expect.poll(() => eventNames(page)).toContain('add_to_cart')

    const addToCart = (await trackedEvents(page)).find((e) => e.name === 'add_to_cart')
    expect(addToCart.params.currency).toBe('EUR')
    expect(addToCart.params.value).toBe(SAMPLE_WATCH.price)
    expect(addToCart.params.items[0].item_brand).toBeTruthy()

    await expect.poll(() => eventNames(page)).toContain('view_cart')

    // Départ vers le checkout.
    await page.getByRole('button', { name: 'Commander' }).click()
    await expect(page).toHaveURL(/\/checkout$/)

    await expect.poll(() => eventNames(page)).toContain('begin_checkout')
    const beginCheckout = (await trackedEvents(page)).find((e) => e.name === 'begin_checkout')
    expect(beginCheckout.params.value).toBe(SAMPLE_WATCH.price)
    expect(beginCheckout.params.items).toHaveLength(1)
  })

  test('n’envoie rien tant que le consentement n’est pas donné', async ({ page }) => {
    await seedBrowser(page, { cartLines: [] })
    await stubSupabaseCatalog(page)
    await mockOrderBackend(page)

    await page.goto(`/montre/${SAMPLE_WATCH_SLUG}`)
    await expect(page.getByRole('heading', { level: 1, name: SAMPLE_WATCH.name })).toBeVisible()

    await page.getByRole('button', { name: 'Ajouter au panier' }).first().click()
    await expect(page.getByLabel('Mon panier')).toBeVisible()

    // Le tunnel fonctionne, la mesure non : seuls les signaux Consent Mode sont posés.
    expect(await trackedEvents(page)).toEqual([])

    const consentCommands = await page.evaluate(() =>
      (window.dataLayer || [])
        .map((entry) => Array.from(entry))
        .filter((args) => args[0] === 'consent')
        .map((args) => [args[1], args[2]]),
    )
    expect(consentCommands[0][0]).toBe('default')
    expect(consentCommands[0][1]).toMatchObject({
      ad_storage: 'denied',
      analytics_storage: 'denied',
    })
  })

  test('le refus dans le bandeau garde la mesure éteinte', async ({ page }) => {
    await seedBrowser(page, { cartLines: [] })
    await stubSupabaseCatalog(page)
    await mockOrderBackend(page)

    await page.goto(`/montre/${SAMPLE_WATCH_SLUG}`)
    await page.getByRole('button', { name: 'Tout refuser' }).click()

    await page.getByRole('button', { name: 'Ajouter au panier' }).first().click()
    await expect(page.getByLabel('Mon panier')).toBeVisible()

    expect(await trackedEvents(page)).toEqual([])
  })

  test('accepter dans le bandeau réactive la mesure sans recharger', async ({ page }) => {
    await seedBrowser(page, { cartLines: [] })
    await stubSupabaseCatalog(page)
    await mockOrderBackend(page)

    await page.goto(`/montre/${SAMPLE_WATCH_SLUG}`)
    await page.getByRole('button', { name: 'Tout accepter' }).click()

    await page.getByRole('button', { name: 'Ajouter au panier' }).first().click()
    await expect.poll(() => eventNames(page)).toContain('add_to_cart')

    const consentUpdate = await page.evaluate(() =>
      (window.dataLayer || [])
        .map((entry) => Array.from(entry))
        .filter((args) => args[0] === 'consent' && args[1] === 'update')
        .map((args) => args[2]),
    )
    expect(consentUpdate.at(-1)).toMatchObject({
      analytics_storage: 'granted',
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
    })
  })
})
