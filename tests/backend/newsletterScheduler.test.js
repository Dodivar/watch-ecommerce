import { createRequire } from 'node:module'
import { describe, expect, it, vi } from 'vitest'

const require = createRequire(import.meta.url)
const { runDueCampaigns } = require('../../backend/newsletter/scheduler.js')

/**
 * Fabrique un mock de client Supabase dont l'update conditionnel d'un « claim »
 * renvoie `claimResult` (`{ data, error }`). Trace les payloads d'update.
 */
function mockSupabase(claimResult) {
  const updates = []
  const chain = {
    update: vi.fn((payload) => {
      updates.push(payload)
      return chain
    }),
    eq: vi.fn(() => chain),
    select: vi.fn(() => chain),
    maybeSingle: vi.fn(async () => claimResult),
  }
  return { supabase: { from: vi.fn(() => chain) }, updates }
}

const site = { id: 'demo-store', config: { backend: {} } }
const baseArgs = { site, mailjet: {}, settings: {}, apiBase: 'https://demo.example.fr' }

describe('runDueCampaigns', () => {
  it('claims a due campaign as sending and dispatches it', async () => {
    const { supabase, updates } = mockSupabase({ data: { id: 'c1' }, error: null })
    const sendFn = vi.fn(async () => ({ sent: 3, total: 3, status: 'sent' }))
    const campaign = { id: 'c1', subject: 'Nouveautés', created_by: 'admin@x.co' }

    await runDueCampaigns({ ...baseArgs, supabase, campaigns: [campaign], sendFn })

    // La campagne est d'abord réclamée en « sending ».
    expect(updates[0].status).toBe('sending')
    // Puis envoyée via le cœur d'envoi partagé.
    expect(sendFn).toHaveBeenCalledTimes(1)
    expect(sendFn.mock.calls[0][0].campaign).toBe(campaign)
    expect(sendFn.mock.calls[0][0].createdBy).toBe('admin@x.co')
  })

  it('skips a campaign whose claim was already taken (cancelled / another tick)', async () => {
    const { supabase } = mockSupabase({ data: null, error: null })
    const sendFn = vi.fn(async () => ({ sent: 0, total: 0, status: 'failed' }))

    await runDueCampaigns({
      ...baseArgs,
      supabase,
      campaigns: [{ id: 'c2', subject: 'Annulée' }],
      sendFn,
    })

    expect(sendFn).not.toHaveBeenCalled()
  })
})
