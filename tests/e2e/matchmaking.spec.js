import { test, expect } from '@playwright/test'

import { seedBrowser, stubSupabaseCatalog } from './support/mocks.js'
import { SAMPLE_WATCH, SECOND_WATCH } from './support/fixtures.js'

/** Troisième montre, d'une autre maison et plus chère : ouvre les écrans budget et marque. */
const THIRD_WATCH = {
  watchId: 'e2e-watch-003',
  name: 'Orion Méridien GMT',
  reference: 'ORN-MER-003',
  price: 12000,
  slug: 'orion-meridien-gmt',
  brand: 'Orion',
  model: 'Méridien',
  imageUrl: null,
  quantity: 1,
}

const STORAGE_KEY = 'watch-ecommerce:matchmaking:sauvage-watches'

/**
 * Décalage horizontal lu dans un `transform` calculé. La carte bascule en profondeur
 * (`perspective` + `rotateY`) : le navigateur rend alors une `matrix3d`, où la translation
 * en x est le 13ᵉ terme et non le 5ᵉ.
 *
 * @param {string} transform
 * @returns {number}
 */
function translateXOf(transform) {
  const [, kind, values] = /(matrix3d|matrix)\(([^)]+)\)/.exec(transform) || []
  if (!values) return Number.NaN
  const terms = values.split(',').map((term) => Number(term))
  return kind === 'matrix3d' ? terms[12] : terms[4]
}

/**
 * Vrai quand la carte ne glisse pas à plat : le second terme de la matrice porte le sinus de
 * l'inclinaison, nul pour une translation pure. Ce qu'on veut lire est justement la
 * différence entre « la carte se déplace » et « la carte se déplace **en penchant** ».
 *
 * @param {string} transform
 * @returns {boolean}
 */
function isTilted(transform) {
  const [, , values] = /(matrix3d|matrix)\(([^)]+)\)/.exec(transform) || []
  if (!values) return false
  return Math.abs(Number(values.split(',')[1])) > 0.01
}

/**
 * « Coup de foudre » : préférences guidées → deck → détail → fin → shortlist,
 * puis reprise de la session après rechargement (localStorage).
 */
test.describe('Coup de foudre', () => {
  test('parcours complet et session conservée au rechargement', async ({ page }) => {
    await seedBrowser(page, { cartLines: [] })
    await stubSupabaseCatalog(page, { watches: [SAMPLE_WATCH, SECOND_WATCH, THIRD_WATCH] })

    await page.goto('/coup-de-foudre')

    // Onboarding : on avance jusqu'au dernier écran sans exprimer de préférence.
    await expect(page.getByText(/Étape 1 sur \d/)).toBeVisible()
    const start = page.getByRole('button', { name: 'Voir les montres' })
    for (let guard = 0; guard < 6 && !(await start.isVisible()); guard += 1) {
      await page.getByRole('button', { name: 'Continuer' }).click()
    }
    await start.click()

    // Deck : première carte, compteur, coup de cœur au bouton.
    await expect(page.getByText('1 sur 3')).toBeVisible()
    // Les cartes suivantes sont montées derrière la courante : on vise la carte active.
    const currentCard = page.getByTestId('match-current-card')
    await expect(currentCard).toContainText('Héritage')
    await page.getByRole('button', { name: 'Coup de cœur', exact: true }).click()
    await expect(page.getByText('2 sur 3')).toBeVisible()

    // Détail : la décision prise dans la lightbox fait avancer le deck.
    await page.getByRole('button', { name: 'Voir le détail' }).click()
    // Nommée, pour ne pas confondre avec le bandeau cookies (lui aussi un `dialog`).
    const dialog = page.getByRole('dialog', { name: /Détail/ })
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('Explorateur')
    await dialog.getByRole('button', { name: 'Passer' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByText('3 sur 3')).toBeVisible()

    // Dernière carte au clavier.
    await page.keyboard.press('ArrowRight')

    // Fin de parcours → shortlist.
    await expect(page.getByRole('heading', { name: 'Vous avez vu tout le monde.' })).toBeVisible()
    await page.getByRole('button', { name: /Voir mes coups de cœur/ }).click()
    await expect(page.getByRole('heading', { name: 'Vos coups de cœur' })).toBeVisible()
    const cards = page.locator('article')
    await expect(cards).toHaveCount(2)
    await expect(cards.first()).toContainText('Héritage')
    await expect(cards.nth(1)).toContainText('Méridien')

    // Session locale : seuls des identifiants, jamais les montres.
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), STORAGE_KEY)
    expect(stored.step).toBe('shortlist')
    expect(stored.liked).toEqual([SAMPLE_WATCH.watchId, THIRD_WATCH.watchId])
    expect(stored.passed).toEqual([SECOND_WATCH.watchId])
    expect(JSON.stringify(stored)).not.toContain('Héritage')

    // Rechargement : la shortlist revient telle quelle.
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Vos coups de cœur' })).toBeVisible()
    await expect(page.locator('article')).toHaveCount(2)

    // Retrait d'un coup de cœur.
    await page.getByRole('button', { name: /Retirer Héritage/ }).click()
    await expect(page.locator('article')).toHaveCount(1)
  })

  /**
   * Le geste au doigt, sur un contexte tactile (le deck n'écoutait que les Pointer Events,
   * que Safari iOS coupe dès qu'il soupçonne un défilement : la carte restait figée sur
   * iPhone). Les événements sont poussés par CDP, seule voie pour un vrai `touchmove`.
   */
  test.describe('au doigt', () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

    test('la carte suit le doigt puis part en coup de cœur', async ({ page }) => {
      // Consentement déjà donné : sur un écran de téléphone, le bandeau cookies couvre
      // toute la page et interceperait le geste.
      await seedBrowser(page, { cartLines: [], consent: { analytics: false, marketing: false } })
      await stubSupabaseCatalog(page, { watches: [SAMPLE_WATCH, SECOND_WATCH, THIRD_WATCH] })

      await page.goto('/coup-de-foudre')

      const start = page.getByRole('button', { name: 'Voir les montres' })
      for (let guard = 0; guard < 6 && !(await start.isVisible()); guard += 1) {
        await page.getByRole('button', { name: 'Continuer' }).click()
      }
      await start.click()

      const currentCard = page.getByTestId('match-current-card')
      await expect(currentCard).toContainText('Héritage')
      const box = await currentCard.boundingBox()
      const y = box.y + box.height / 2
      const x = box.x + box.width / 2

      const cdp = await page.context().newCDPSession(page)
      const touch = (type, point) =>
        cdp.send('Input.dispatchTouchEvent', {
          type,
          touchPoints: point ? [{ x: point.x, y: point.y, id: 1 }] : [],
        })

      // Le doigt décolle en arc, comme un vrai pouce.
      await touch('touchStart', { x, y })
      for (const [dx, dy] of [
        [6, -10],
        [40, -18],
        [90, -16],
      ]) {
        await touch('touchMove', { x: x + dx, y: y + dy })
      }

      // La carte a bel et bien suivi le doigt, et la mention « coup de cœur » est apparue.
      const transform = await currentCard.evaluate((el) => getComputedStyle(el).transform)
      expect(transform).not.toBe('none')
      expect(translateXOf(transform)).toBeGreaterThan(50)

      await touch('touchMove', { x: x + 160, y })
      await touch('touchEnd', null)

      // Geste engagé : la montre est aimée et le deck avance, sans que le clic de fin de
      // glissement n'ouvre le détail de la montre qu'on vient d'aimer.
      await expect(page.getByText('2 sur 3')).toBeVisible()
      await expect(page.getByRole('dialog', { name: /Détail/ })).toBeHidden()
      const stored = await page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)),
        STORAGE_KEY,
      )
      expect(stored.liked).toEqual([SAMPLE_WATCH.watchId])
    })

    /**
     * Le même geste sur un téléphone réglé sur « Réduire les animations » (Réglages →
     * Accessibilité → Mouvement, très répandu sur iPhone). La carte y glissait à plat :
     * inclinaison et bascule en profondeur étaient retirées avec l'envol, et le geste ne
     * rendait plus rien — l'écran donnait le sentiment que rien n'avait été livré, alors que
     * le même appareil émulé au bureau, lui, ne porte pas le réglage et montrait tout.
     *
     * Ce qui suit le doigt n'est pas une animation : ça reste.
     */
    test('la carte penche encore sous le doigt, animations réduites', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await seedBrowser(page, { cartLines: [], consent: { analytics: false, marketing: false } })
      await stubSupabaseCatalog(page, { watches: [SAMPLE_WATCH, SECOND_WATCH, THIRD_WATCH] })

      await page.goto('/coup-de-foudre')

      const start = page.getByRole('button', { name: 'Voir les montres' })
      for (let guard = 0; guard < 6 && !(await start.isVisible()); guard += 1) {
        await page.getByRole('button', { name: 'Continuer' }).click()
      }
      await start.click()

      // Le réglage est bien vu par la page : sans quoi le test ne prouverait rien.
      expect(
        await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches),
      ).toBe(true)

      const currentCard = page.getByTestId('match-current-card')
      await expect(currentCard).toContainText('Héritage')
      const box = await currentCard.boundingBox()
      const y = box.y + box.height / 2
      const x = box.x + box.width / 2

      const cdp = await page.context().newCDPSession(page)
      const touch = (type, point) =>
        cdp.send('Input.dispatchTouchEvent', {
          type,
          touchPoints: point ? [{ x: point.x, y: point.y, id: 1 }] : [],
        })

      await touch('touchStart', { x, y })
      for (const [dx, dy] of [
        [6, -10],
        [40, -18],
        [90, -16],
      ]) {
        await touch('touchMove', { x: x + dx, y: y + dy })
      }

      const transform = await currentCard.evaluate((el) => getComputedStyle(el).transform)
      expect(translateXOf(transform)).toBeGreaterThan(50)
      expect(isTilted(transform)).toBe(true)

      // La sortie, elle, est bien une animation : elle reste retirée.
      await touch('touchMove', { x: x + 160, y })
      await touch('touchEnd', null)
      await expect(page.getByText('2 sur 3')).toBeVisible()
    })
  })

  test('un budget qui vide le pool propose de l’élargir', async ({ page }) => {
    await seedBrowser(page, { cartLines: [] })
    await stubSupabaseCatalog(page, { watches: [SAMPLE_WATCH, SECOND_WATCH, THIRD_WATCH] })

    await page.goto('/coup-de-foudre')

    // Budget minimum au-dessus de toutes les montres.
    const minInput = page.getByLabel('Minimum')
    await minInput.fill('11950')
    const maxInput = page.getByLabel('Maximum')
    await maxInput.fill('11960')
    await maxInput.blur()

    await expect(page.getByText(/Aucune montre dans ce budget/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continuer' })).toBeDisabled()
  })

  test('un budget poussé au maximum s’enregistre sans plafond', async ({ page }) => {
    await seedBrowser(page, { cartLines: [] })
    await stubSupabaseCatalog(page, { watches: [SAMPLE_WATCH, SECOND_WATCH, THIRD_WATCH] })

    await page.goto('/coup-de-foudre')

    // Seule la borne basse est relevée : la haute reste au bout du curseur.
    await page.getByLabel('Minimum').fill('11000')
    await page.getByLabel('Minimum').blur()

    await expect(
      page.getByText(/nous vous prévenons aussi pour les montres plus chères/),
    ).toBeVisible()
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), STORAGE_KEY)
    // `max: null` et non 12 000 € : ce qui part vers l'alerte ne doit pas être plafonné au prix
    // de la montre la plus chère en stock le jour de l'inscription.
    expect(stored.preferences.budget).toEqual({ min: 11000, max: null })
  })

  test('l’alerte emporte les options affichées et un budget sans plancher figé', async ({
    page,
  }) => {
    await seedBrowser(page, { cartLines: [] })
    await stubSupabaseCatalog(page, { watches: [SAMPLE_WATCH, SECOND_WATCH, THIRD_WATCH] })
    /** @type {any} */
    let payload = null
    await page.route('**/api/watch-match-alerts/subscribe', async (route) => {
      payload = route.request().postDataJSON()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
    })

    await page.goto('/coup-de-foudre')

    // Seule la borne haute descend : le plancher n'est pas le prix de la montre la moins chère.
    await page.getByLabel('Maximum').fill('6000')
    await page.getByLabel('Maximum').blur()
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), STORAGE_KEY)
    expect(stored.preferences.budget).toEqual({ min: 0, max: 6000 })

    // Marque : « Sauvage » cochée parmi les deux maisons affichées.
    await page.getByRole('button', { name: 'Continuer' }).click()
    await page.getByRole('button', { name: 'Sauvage', exact: true }).click()
    const start = page.getByRole('button', { name: 'Voir les montres' })
    for (let guard = 0; guard < 6 && !(await start.isVisible()); guard += 1) {
      await page.getByRole('button', { name: 'Continuer' }).click()
    }
    await start.click()

    // Deux montres dans le budget, puis l'écran de fin et son formulaire d'alerte.
    await expect(page.getByText('1 sur 2')).toBeVisible()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByText('2 sur 2')).toBeVisible()
    await page.keyboard.press('ArrowRight')

    await page.getByPlaceholder('Votre e-mail').fill('alerte@example.fr')
    await page.getByRole('checkbox', { name: /J’accepte de recevoir/ }).check()
    await page.getByRole('button', { name: 'Me prévenir' }).click()
    await expect(page.getByText(/C’est noté/)).toBeVisible()

    expect(payload.criteria.brand).toEqual(['sauvage'])
    expect(payload.criteria.budget).toEqual({ min: 0, max: 6000 })
    // Orion était affichée et pas cochée : l'alerte le saura. Une maison qui n'existe pas
    // encore au catalogue n'y figure pas — elle ne sera donc pas lue comme un refus.
    expect(payload.criteria.offered.brand).toEqual(['orion', 'sauvage'])
    expect(payload.criteria).not.toHaveProperty('seen')
  })

  /**
   * Page « mes préférences », atteinte par le lien de chaque e-mail d'alerte. Le backend est
   * simulé : ce qui compte ici est ce que la page envoie, et ce qu'elle laisse dans l'URL.
   */
  test.describe('mes préférences', () => {
    const TOKEN = '6f1c2a4e-8b3d-4c5e-9f10-a1b2c3d4e5f6'

    test('retire le jeton de l’URL et enregistre les options affichées', async ({ page }) => {
      // Mesure acceptée : c'est précisément le cas où le jeton ne doit pas partir chez Google.
      await seedBrowser(page, { cartLines: [], consent: { analytics: true, marketing: true } })
      await stubSupabaseCatalog(page, { watches: [SAMPLE_WATCH, SECOND_WATCH, THIRD_WATCH] })
      /** @type {any} */
      let putBody = null
      const tokens = []
      await page.route('**/api/watch-match-alerts/preferences', async (route) => {
        const request = route.request()
        tokens.push(request.headers()['x-alert-token'])
        if (request.method() === 'PUT') {
          putBody = request.postDataJSON()
          return route.fulfill({ json: { success: true } })
        }
        return route.fulfill({
          json: {
            success: true,
            status: 'active',
            email: 'c•••@example.fr',
            locale: 'fr',
            // Une maison cochée il y a des mois, qui n'est plus au catalogue.
            criteria: { brand: ['patek philippe'], budget: null },
          },
        })
      })

      await page.goto(`/coup-de-foudre/mes-preferences#token=${TOKEN}`)
      await expect(page.getByRole('heading', { name: 'Vos préférences d’alerte' })).toBeVisible()
      // Le jeton ne reste pas dans la barre d'adresse (mesure d'audience, historique partagé).
      expect(new URL(page.url()).hash).toBe('')
      const measured = await page.evaluate(() => JSON.stringify(window.dataLayer ?? []))
      expect(measured).not.toContain(TOKEN)
      await expect(page.getByText('Alerte envoyée à c•••@example.fr')).toBeVisible()

      const save = page.getByRole('button', { name: 'Enregistrer', exact: true })
      await expect(save).toBeDisabled()

      // Décochée, la maison hors stock reste à l'écran pour pouvoir être recochée.
      const patek = page.getByRole('button', { name: 'Patek Philippe', exact: true })
      await patek.click()
      await expect(patek).toHaveAttribute('aria-pressed', 'false')
      await page.getByRole('button', { name: 'Orion', exact: true }).click()
      await save.click()
      await expect(page.getByText(/C’est enregistré/)).toBeVisible()

      expect(tokens.length).toBeGreaterThan(0)
      expect(tokens.every((token) => token === TOKEN)).toBe(true)
      expect(putBody.criteria.brand).toEqual(['orion'])
      // Tout ce que la page a montré — Patek Philippe comprise, affichée puis décochée.
      expect(putBody.criteria.offered.brand).toEqual(['orion', 'sauvage', 'patek philippe'])
      await expect(save).toBeDisabled()
    })

    test('sans jeton, la page dit que le lien n’est plus valide', async ({ page }) => {
      await seedBrowser(page, { cartLines: [] })
      await stubSupabaseCatalog(page, { watches: [SAMPLE_WATCH] })
      await page.goto('/coup-de-foudre/mes-preferences')
      await expect(page.getByRole('heading', { name: 'Ce lien n’est plus valide' })).toBeVisible()
    })

    test('une alerte désinscrite ne se modifie pas', async ({ page }) => {
      await seedBrowser(page, { cartLines: [] })
      await stubSupabaseCatalog(page, { watches: [SAMPLE_WATCH] })
      await page.route('**/api/watch-match-alerts/preferences', (route) =>
        route.fulfill({
          json: { success: true, status: 'unsubscribed', email: 'c•••@example.fr', criteria: null },
        }),
      )
      await page.goto(`/coup-de-foudre/mes-preferences#token=${TOKEN}`)
      await expect(page.getByRole('heading', { name: 'Cette alerte est désactivée' })).toBeVisible()
    })
  })
})
