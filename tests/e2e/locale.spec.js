import { test, expect } from '@playwright/test'

import { seedBrowser, stubSupabaseCatalog } from './support/mocks.js'
import { SAMPLE_WATCH } from './support/fixtures.js'

/**
 * Vitrine multilingue (fr / en / de).
 *
 * Deux mécanismes portent la fonctionnalité et méritent d'être vérifiés dans un vrai
 * navigateur : le préfixe de langue est porté par la base d'historique de vue-router
 * (donc les liens existants se préfixent seuls), et le changement de langue est une
 * navigation complète (le manifest est figé au chargement de la page).
 */
test.describe('Vitrine multilingue', () => {
  test.beforeEach(async ({ page }) => {
    await seedBrowser(page, { cartLines: [] })
    await stubSupabaseCatalog(page, { watches: [SAMPLE_WATCH] })
  })

  test('sert le français sans préfixe et les autres langues sous /en et /de', async ({ page }) => {
    await page.goto('/collection')
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr')

    await page.goto('/en/collection')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')

    await page.goto('/de/collection')
    await expect(page.locator('html')).toHaveAttribute('lang', 'de')
  })

  test('traduit la navigation et préfixe tous les liens', async ({ page }) => {
    await page.goto('/de/')
    await expect(page.getByRole('link', { name: 'Unsere Uhren' }).first()).toBeVisible()

    // Aucun lien interne ne doit retomber sur la version française.
    const hrefs = await page.$$eval('header nav a[href^="/"]', (links) =>
      links.map((link) => link.getAttribute('href')),
    )
    expect(hrefs.length).toBeGreaterThan(0)
    expect(hrefs.every((href) => href.startsWith('/de'))).toBe(true)
  })

  test('résout une URL préfixée sur la même route que la version française', async ({ page }) => {
    await page.goto('/en/collection')
    // La table de routes est commune aux trois langues : la page de collection répond bien.
    await expect(page.getByText(SAMPLE_WATCH.name).first()).toBeVisible()
  })

  test('change de langue depuis le sélecteur et mémorise le choix', async ({ page }) => {
    await page.goto('/collection')
    await page.getByRole('button', { name: /Langue/ }).click()
    await page.getByRole('option', { name: 'Deutsch' }).click()

    await expect(page).toHaveURL(/\/de\/collection$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'de')

    // Le choix explicite l'emporte ensuite sur une URL sans préfixe.
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('lang', 'de')
  })

  test('déclare les équivalents hreflang des trois langues', async ({ page }) => {
    await page.goto('/en/collection')
    const alternates = await page.$$eval('link[rel="alternate"][hreflang]', (links) =>
      links.map((link) => link.getAttribute('hreflang')),
    )
    expect(alternates).toEqual(expect.arrayContaining(['fr', 'en', 'de', 'x-default']))
  })

  test('garde le back-office en français, sans préfixe de langue', async ({ page }) => {
    await page.goto('/de/admin/login')
    await expect(page).toHaveURL(/\/admin\/login$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
  })
})
