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
      const [, moved] = /matrix\(([^)]+)\)/.exec(transform) || []
      expect(Number(moved.split(',')[4])).toBeGreaterThan(50)

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
})
