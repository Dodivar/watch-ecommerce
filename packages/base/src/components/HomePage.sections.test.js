import { describe, expect, it } from 'vitest'

import { resolveSiteConfig } from '@/site/resolveSiteConfig.js'
import { filterHomeSectionsByFeatures } from '@/site/homeSections.js'
import { noCollection, retailMinimal } from '../../../../tests/fixtures/manifests.js'

function expectedSectionIds(manifest) {
  const site = resolveSiteConfig(manifest)
  return filterHomeSectionsByFeatures(site.home.sections, site.features, site)
}

describe('HomePage sections (logique filtrage)', () => {
  it('filtre les sections pour retailMinimal', () => {
    expect(expectedSectionIds(retailMinimal)).toEqual(['hero', 'trust'])
  })

  it('filtre les sections pour noCollection sans selections', () => {
    const ids = expectedSectionIds(noCollection)
    expect(ids).toContain('hero')
    expect(ids).not.toContain('selections')
    expect(ids.length).toBeGreaterThan(0)
  })
})
