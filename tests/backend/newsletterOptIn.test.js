import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const { recordNewsletterOptIn, isOptInTruthy } = require('../../backend/newsletter/optIn.js')

/**
 * Petit client Supabase simulé, chaînable, qui enregistre les insert/update.
 */
function makeSupabase({ existing = null, failOn = null } = {}) {
  const calls = { insert: null, update: null, updatedId: null, tables: [] }
  function builder() {
    const b = {
      select: () => b,
      eq(col, val) {
        if (col === 'id') calls.updatedId = val
        return b
      },
      maybeSingle: () =>
        failOn === 'select'
          ? Promise.reject(new Error('boom'))
          : Promise.resolve({ data: existing }),
      insert(row) {
        calls.insert = row
        return failOn === 'insert'
          ? Promise.reject(new Error('boom'))
          : Promise.resolve({ error: null })
      },
      update(row) {
        calls.update = row
        return { eq: (col, val) => { if (col === 'id') calls.updatedId = val; return Promise.resolve({ error: null }) } }
      },
    }
    return b
  }
  return {
    calls,
    client: {
      from(table) {
        calls.tables.push(table)
        return builder()
      },
    },
  }
}

describe('isOptInTruthy', () => {
  it('accepts explicit positive values (checkbox / JSON)', () => {
    for (const v of [true, 'true', 'on', '1', 1]) {
      expect(isOptInTruthy(v)).toBe(true)
    }
  })

  it('rejects everything else (unchecked = no consent)', () => {
    for (const v of [false, 'false', '0', '', undefined, null, 'no', 0]) {
      expect(isOptInTruthy(v)).toBe(false)
    }
  })
})

describe('recordNewsletterOptIn', () => {
  it('ignores an invalid email without touching the database', async () => {
    const { client, calls } = makeSupabase()
    const result = await recordNewsletterOptIn(client, 'site', { email: 'not-an-email' })
    expect(result.ok).toBe(false)
    expect(calls.tables).toHaveLength(0)
  })

  it('inserts a new subscriber with explicit consent', async () => {
    const { client, calls } = makeSupabase({ existing: null })
    const result = await recordNewsletterOptIn(client, 'demo', {
      email: 'Client@Example.FR',
      name: 'Client',
    })
    expect(result.ok).toBe(true)
    expect(calls.insert).toMatchObject({
      site_id: 'demo',
      email: 'client@example.fr', // normalisé en minuscules
      status: 'subscribed',
      source: 'optin',
      name: 'Client',
    })
    expect(calls.insert.consent_at).toBeTruthy()
  })

  it('reactivates an existing subscriber instead of duplicating', async () => {
    const { client, calls } = makeSupabase({ existing: { id: 'sub-1', consent_at: null } })
    const result = await recordNewsletterOptIn(client, 'demo', { email: 'x@example.fr' })
    expect(result.ok).toBe(true)
    expect(calls.insert).toBeNull()
    expect(calls.update).toMatchObject({ status: 'subscribed', unsubscribed_at: null })
    expect(calls.updatedId).toBe('sub-1')
  })

  it('never throws on a database error (returns ok:false)', async () => {
    const { client } = makeSupabase({ failOn: 'insert' })
    const result = await recordNewsletterOptIn(client, 'demo', { email: 'x@example.fr' })
    expect(result.ok).toBe(false)
  })
})
