import { describe, expect, it } from 'vitest'

import { getActiveRoutePaths } from '@/site/appRouteMeta.js'
import { resolveSiteConfig } from '@/site/resolveSiteConfig.js'
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
import { listBuildableSiteIds, loadRawSiteConfig } from '../helpers/sites.js'

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
})
