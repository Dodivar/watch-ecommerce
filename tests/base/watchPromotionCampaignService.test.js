import { describe, it, expect } from 'vitest'
import {
  buildCampaignCollectionQuery,
  getActiveCampaignBySlugPublic,
} from '../../packages/base/src/services/watchPromotionCampaignService.js'

describe('watchPromotionCampaignService', () => {
  describe('buildCampaignCollectionQuery', () => {
    it('builds collection URL with event query param', () => {
      expect(buildCampaignCollectionQuery('soldes-ete')).toBe('/collection?event=soldes-ete')
    })

    it('merges extra query params', () => {
      expect(buildCampaignCollectionQuery('vip', { brand: 'Rolex' })).toBe(
        '/collection?event=vip&brand=Rolex',
      )
    })

    it('skips empty extra values', () => {
      expect(buildCampaignCollectionQuery('vip', { brand: '', sort: null })).toBe(
        '/collection?event=vip',
      )
    })

    it('lets extra query override event when same key is passed', () => {
      expect(buildCampaignCollectionQuery('vip', { event: 'other' })).toBe('/collection?event=other')
    })
  })

  describe('getActiveCampaignBySlugPublic', () => {
    it('returns null for invalid slug without hitting the database', async () => {
      await expect(getActiveCampaignBySlugPublic('Invalid Slug!')).resolves.toBeNull()
      await expect(getActiveCampaignBySlugPublic('')).resolves.toBeNull()
    })
  })
})
