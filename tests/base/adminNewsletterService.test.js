import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../packages/base/src/services/supabase', () => ({
  supabase: { from: vi.fn(), auth: { getSession: vi.fn() } },
}))

vi.mock('../../packages/base/src/services/admin/adminSiteContext.js', () => ({
  getAdminSiteId: () => 'test-site',
}))

vi.mock('../../packages/base/src/site/getSiteConfig.js', () => ({
  getSiteConfig: vi.fn(),
}))

import {
  addSubscriber,
  defaultSettings,
  scheduleCampaign,
  cancelScheduledCampaign,
  CAMPAIGN_STATUSES,
} from '../../packages/base/src/services/admin/adminNewsletterService.js'
import { getSiteConfig } from '../../packages/base/src/site/getSiteConfig.js'
import { supabase } from '../../packages/base/src/services/supabase'

/**
 * Construit un mock de requête Supabase chaînable dont le dernier maillon
 * (`.single()`) résout `{ data, error }`. Enregistre le payload passé à `.update()`.
 */
function mockUpdateChain(result) {
  const calls = {}
  const chain = {
    update: vi.fn((payload) => {
      calls.update = payload
      return chain
    }),
    eq: vi.fn(() => chain),
    in: vi.fn(() => chain),
    select: vi.fn(() => chain),
    single: vi.fn(async () => result),
  }
  supabase.from.mockReturnValue(chain)
  return { chain, calls }
}

describe('adminNewsletterService', () => {
  describe('addSubscriber validation', () => {
    it('rejects an empty email', async () => {
      await expect(addSubscriber({ email: '' })).rejects.toThrow(/Email requis/)
    })

    it('rejects a whitespace-only email', async () => {
      await expect(addSubscriber({ email: '   ' })).rejects.toThrow(/Email requis/)
    })
  })

  describe('defaultSettings', () => {
    beforeEach(() => {
      getSiteConfig.mockReset()
    })

    it('derives branding from the site manifest', () => {
      getSiteConfig.mockReturnValue({
        brand: { displayName: 'Demo', legalName: 'Demo Watches SARL' },
        theme: { colors: { primary: '#123456' } },
      })
      const settings = defaultSettings()
      expect(settings.logoText).toBe('DEMO')
      expect(settings.accentColor).toBe('#123456')
      expect(settings.senderName).toBe('Demo Watches SARL')
      expect(settings.headerHtml).toBe('')
      expect(settings.footerHtml).toBe('')
    })

    it('falls back to a default accent color when the theme has none', () => {
      getSiteConfig.mockReturnValue({ brand: { displayName: 'Demo' }, theme: {} })
      expect(defaultSettings().accentColor).toBe('#d4af37')
    })
  })

  it('exposes the campaign status vocabulary', () => {
    expect(CAMPAIGN_STATUSES).toEqual([
      'draft',
      'scheduled',
      'sending',
      'sent',
      'failed',
      'cancelled',
    ])
  })

  describe('scheduleCampaign', () => {
    beforeEach(() => {
      supabase.from.mockReset()
    })

    it('rejects an invalid date', async () => {
      await expect(scheduleCampaign('c1', 'not-a-date')).rejects.toThrow(/invalide/)
      expect(supabase.from).not.toHaveBeenCalled()
    })

    it('rejects a date in the past', async () => {
      const past = new Date(Date.now() - 60_000).toISOString()
      await expect(scheduleCampaign('c1', past)).rejects.toThrow(/futur/)
      expect(supabase.from).not.toHaveBeenCalled()
    })

    it('writes the scheduled status and time for a future date', async () => {
      const future = new Date(Date.now() + 3_600_000).toISOString()
      const { calls } = mockUpdateChain({
        data: { id: 'c1', status: 'scheduled', scheduled_at: future },
        error: null,
      })
      const result = await scheduleCampaign('c1', future)
      expect(calls.update.status).toBe('scheduled')
      expect(calls.update.scheduled_at).toBe(future)
      expect(result.status).toBe('scheduled')
      expect(result.scheduledAt).toBe(future)
    })
  })

  describe('cancelScheduledCampaign', () => {
    beforeEach(() => {
      supabase.from.mockReset()
    })

    it('clears the schedule and marks the campaign cancelled', async () => {
      const { calls } = mockUpdateChain({
        data: { id: 'c1', status: 'cancelled', scheduled_at: null },
        error: null,
      })
      const result = await cancelScheduledCampaign('c1')
      expect(calls.update.status).toBe('cancelled')
      expect(calls.update.scheduled_at).toBeNull()
      expect(result.status).toBe('cancelled')
      expect(result.scheduledAt).toBeNull()
    })
  })
})
