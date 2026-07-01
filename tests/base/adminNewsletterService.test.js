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

import { addSubscriber, defaultSettings, CAMPAIGN_STATUSES } from '../../packages/base/src/services/admin/adminNewsletterService.js'
import { getSiteConfig } from '../../packages/base/src/site/getSiteConfig.js'

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
    expect(CAMPAIGN_STATUSES).toEqual(['draft', 'sending', 'sent', 'failed'])
  })
})
