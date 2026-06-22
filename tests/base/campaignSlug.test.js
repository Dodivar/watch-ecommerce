import { describe, it, expect } from 'vitest'
import {
  slugifyCampaignName,
  appendCampaignSlugSuffix,
  isValidCampaignSlug,
} from '../../packages/base/src/utils/campaignSlug.js'
import { buildCampaignCollectionQuery } from '../../packages/base/src/services/watchPromotionCampaignService.js'

describe('campaignSlug utils', () => {
  it('slugifyCampaignName normalizes French titles', () => {
    expect(slugifyCampaignName('Soldes d\'Été 2026')).toBe('soldes-dete-2026')
  })

  it('appendCampaignSlugSuffix adds numeric suffix', () => {
    expect(appendCampaignSlugSuffix('soldes-ete', 3)).toBe('soldes-ete-3')
  })

  it('isValidCampaignSlug accepts lowercase hyphenated slugs', () => {
    expect(isValidCampaignSlug('soldes-ete')).toBe(true)
    expect(isValidCampaignSlug('Soldes')).toBe(false)
    expect(isValidCampaignSlug('soldes_ete')).toBe(false)
  })
})

describe('buildCampaignCollectionQuery', () => {
  it('builds collection URL with event slug', () => {
    expect(buildCampaignCollectionQuery('soldes-ete')).toBe('/collection?event=soldes-ete')
  })

  it('merges extra query params', () => {
    expect(buildCampaignCollectionQuery('soldes-ete', { public: 'homme' })).toBe(
      '/collection?event=soldes-ete&public=homme',
    )
  })
})
