import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { getActiveRoutePaths } from '@/site/appRouteMeta.js'
import { resolveSiteConfig } from '@/site/resolveSiteConfig.js'
import {
  MAX_WATCH_GUARANTEES,
  MIN_WATCH_GUARANTEES,
} from '@/site/watchCatalogDisplay.js'
import { KNOWN_HOME_SECTION_IDS } from '@/site/homeSections.js'
import {
  resolveFooterNavigation,
  resolveMainNavigation,
} from '@/site/mainNavigation.js'

import {
  collectRawNavLinks,
  collectResolvedNavLinks,
  isNavTargetAllowed,
} from '../helpers/routeFeatures.js'
import { SITES_DIR, listBuildableSiteIds, loadRawSiteConfig } from '../helpers/sites.js'

/**
 * @param {ReturnType<typeof resolveSiteConfig>} resolved
 */
export function pickSnapshotFields(resolved) {
  const mainNav = resolveMainNavigation(resolved)
  const footerNav = resolveFooterNavigation(resolved)
  return {
    features: resolved.features,
    homeSections: resolved.home?.sections ?? [],
    watchCatalogMode: resolved.watchCatalog?.mode,
    mainNav: mainNav.map((item) => ({
      type: item.type,
      label: item.label,
      to: item.to,
    })),
    footerNav: footerNav.map((l) => ({ label: l.label, to: l.to })),
  }
}

/** Repères de troncature des résultats Google, en caractères. */
const SEO_LENGTH_LIMITS = { title: 60, metaDescription: 160 }

const siteIds = listBuildableSiteIds()

describe.each(siteIds)('site contract: %s', (siteId) => {
  it('charge et résout le manifest sans erreur', async () => {
    const raw = await loadRawSiteConfig(siteId)
    expect(raw).toBeTypeOf('object')
    const resolved = resolveSiteConfig(raw)
    expect(resolved.features).toBeTypeOf('object')
    expect(pickSnapshotFields(resolved)).toMatchSnapshot()
  })

  it('n’utilise que des ids home.sections connus', async () => {
    const raw = await loadRawSiteConfig(siteId)
    const rawSections = raw.home?.sections
    if (!Array.isArray(rawSections)) return
    for (const id of rawSections) {
      expect(KNOWN_HOME_SECTION_IDS).toContain(id)
    }
  })

  it('aligne features.faq avec le bloc faq', async () => {
    const raw = await loadRawSiteConfig(siteId)
    const resolved = resolveSiteConfig(raw)
    if (raw.faq == null) return
    const hasItems = Array.isArray(raw.faq.items) && raw.faq.items.length > 0
    const expected = Boolean(raw.faq.enabled && hasItems)
    expect(resolved.features.faq).toBe(expected)
  })

  it('aligne watchReference avec watchCatalog.mode', async () => {
    const raw = await loadRawSiteConfig(siteId)
    const resolved = resolveSiteConfig(raw)
    const isResale = resolved.watchCatalog?.mode === 'resale'
    expect(resolved.features.watchReference).toBe(isResale)
  })

  it('désactive estimationProcess si estimation est false', async () => {
    const resolved = resolveSiteConfig(await loadRawSiteConfig(siteId))
    if (!resolved.features.estimation) {
      expect(resolved.features.estimationProcess).toBe(false)
    }
  })

  it('valide urls.production si présente', async () => {
    const raw = await loadRawSiteConfig(siteId)
    const prod = raw.urls?.production
    if (typeof prod !== 'string' || !prod.trim()) return
    expect(() => new URL(prod)).not.toThrow()
  })

  it('exige que les liens bruts avec feature ciblent une capacité activée', async () => {
    const raw = await loadRawSiteConfig(siteId)
    const resolved = resolveSiteConfig(raw)
    const links = collectRawNavLinks(raw.navigation)
    for (const { feature } of links) {
      if (!feature) continue
      expect(
        resolved.features[feature],
        `navigation déclare feature:${feature} mais le flag est désactivé`,
      ).toBe(true)
    }
  })

  it('pointe la navigation résolue vers des routes actives', async () => {
    const resolved = resolveSiteConfig(await loadRawSiteConfig(siteId))
    const activePaths = new Set(getActiveRoutePaths(resolved.features))
    const mainNav = resolveMainNavigation(resolved)
    const footerNav = resolveFooterNavigation(resolved)
    const links = collectResolvedNavLinks(mainNav, footerNav)

    for (const { to } of links) {
      if (!to) continue
      expect(
        isNavTargetAllowed(to, activePaths, resolved.features),
        `lien navigation vers ${to} sans route active correspondante`,
      ).toBe(true)
    }
  })

  it('n’expose pas de checkout actif sans purchase', async () => {
    const resolved = resolveSiteConfig(await loadRawSiteConfig(siteId))
    if (resolved.features.purchase) return
    const methods = resolved.checkout?.shipping?.methods ?? []
    const paidMethods = methods.filter(
      (m) => m && m.type && m.type !== 'pickup',
    )
    expect(paidMethods).toHaveLength(0)
  })

  /**
   * Une image de partage introuvable ne casse rien au build et ne se voit pas dans le site :
   * elle se voit sur Facebook, LinkedIn ou WhatsApp, où le lien part alors sans aperçu. Le
   * fichier est donc vérifié sur disque plutôt qu'à l'œil.
   */
  it('pointe seo.indexHtml.ogImagePath sur un fichier présent dans public/', async () => {
    const raw = await loadRawSiteConfig(siteId)
    const ogImagePath = raw.seo?.indexHtml?.ogImagePath
    expect(typeof ogImagePath, 'seo.indexHtml.ogImagePath est requis').toBe('string')
    expect(ogImagePath.startsWith('/'), 'ogImagePath doit être un chemin absolu').toBe(true)

    const filePath = path.join(SITES_DIR, siteId, 'public', ogImagePath.slice(1))
    expect(
      fs.existsSync(filePath),
      `seo.indexHtml.ogImagePath vaut ${ogImagePath} mais sites/${siteId}/public${ogImagePath} n'existe pas`,
    ).toBe(true)
  })

  /**
   * Longueurs SERP : au-delà, Google tronque ou réécrit, et l'appel à l'action se perd. Les
   * limites sont des repères en caractères — l'affichage réel se mesure en pixels — mais elles
   * suffisent à repérer une description qui part à 200 signes. Vérifié langue par langue :
   * une traduction allemande dépasse là où le français passait.
   */
  it('garde titres et méta-descriptions dans les limites SERP', async () => {
    const raw = await loadRawSiteConfig(siteId)
    const locales = resolveSiteConfig(raw).i18n?.locales ?? ['fr']
    const tooLong = []

    for (const locale of locales) {
      const seo = resolveSiteConfig(raw, locale).seo ?? {}
      for (const [section, block] of Object.entries(seo)) {
        if (!block || typeof block !== 'object') continue
        for (const [key, limit] of Object.entries(SEO_LENGTH_LIMITS)) {
          const value = block[key]
          if (typeof value !== 'string' || value.length <= limit) continue
          tooLong.push(`${locale} · seo.${section}.${key} : ${value.length} > ${limit}`)
        }
      }
    }

    expect(tooLong, 'raccourcir ces textes, ils seront tronqués dans les résultats').toEqual([])
  })

  it('respecte le nombre de garanties fiche montre si configurées', async () => {
    const raw = await loadRawSiteConfig(siteId)
    const items = raw.watchCatalog?.guarantees?.items
    if (!Array.isArray(items) || items.length === 0) return
    expect(items.length).toBeGreaterThanOrEqual(MIN_WATCH_GUARANTEES)
    expect(items.length).toBeLessThanOrEqual(MAX_WATCH_GUARANTEES)
    for (const item of items) {
      expect(item.id).toBeTruthy()
      expect(item.title).toBeTruthy()
      expect(item.text || item.source).toBeTruthy()
    }
  })
})
