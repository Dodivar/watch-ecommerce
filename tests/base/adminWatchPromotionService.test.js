import { describe, it, expect, vi } from 'vitest'

vi.mock('../../packages/base/src/services/supabase', () => ({
  supabase: { from: vi.fn() },
}))

vi.mock('../../packages/base/src/services/admin/adminSiteContext.js', () => ({
  getAdminSiteId: () => 'test-site',
}))

vi.mock('../../packages/base/src/composables/useMenuCampaigns.js', () => ({
  invalidateMenuCampaignsCache: vi.fn(),
}))

import { saveWatchPromotionCampaignDraft, updateWatchPromotionCampaign } from '../../packages/base/src/services/admin/adminWatchPromotionService.js'

const validPayload = {
  name: 'Soldes Été',
  defaultDiscountPercent: 20,
  items: [{ watchId: 'watch-1' }],
  startsAt: '2026-07-01T10:00:00Z',
  endsAt: '2026-07-31T23:59:59Z',
}

describe('adminWatchPromotionService', () => {
  describe('saveWatchPromotionCampaignDraft validation', () => {
    it('requires a campaign title', async () => {
      await expect(
        saveWatchPromotionCampaignDraft({ ...validPayload, name: '   ' }),
      ).rejects.toThrow(/titre de l'événement est requis/)
    })

    it('requires default discount between 1 and 99', async () => {
      await expect(
        saveWatchPromotionCampaignDraft({ ...validPayload, defaultDiscountPercent: 0 }),
      ).rejects.toThrow(/remise par défaut doit être entre 1 et 99/)
      await expect(
        saveWatchPromotionCampaignDraft({ ...validPayload, defaultDiscountPercent: 100 }),
      ).rejects.toThrow(/remise par défaut doit être entre 1 et 99/)
    })

    it('requires at least one watch', async () => {
      await expect(
        saveWatchPromotionCampaignDraft({ ...validPayload, items: [] }),
      ).rejects.toThrow(/Sélectionnez au moins une montre/)
    })

    it('rejects end date before start date', async () => {
      await expect(
        saveWatchPromotionCampaignDraft({
          ...validPayload,
          startsAt: '2026-07-31T23:59:59Z',
          endsAt: '2026-07-01T10:00:00Z',
        }),
      ).rejects.toThrow(/postérieure/)
    })
  })

  describe('updateWatchPromotionCampaign validation', () => {
    it('rejects missing campaign title', async () => {
      await expect(
        updateWatchPromotionCampaign('campaign-1', { ...validPayload, name: '   ' }),
      ).rejects.toThrow(/titre de l'événement est requis/)
    })

    it('rejects empty watch selection', async () => {
      await expect(
        updateWatchPromotionCampaign('campaign-1', { ...validPayload, items: [] }),
      ).rejects.toThrow(/Sélectionnez au moins une montre/)
    })
  })
})
