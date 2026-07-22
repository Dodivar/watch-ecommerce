import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}))

vi.mock('./adminSiteContext.js', () => ({
  getAdminSiteId: () => 'sauvage-watches',
}))

import { supabase } from '../supabase'
import {
  deleteAdminUser,
  inviteAdminUser,
  updateAdminUserRole,
} from './adminUserService.js'

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function stubFetch(response) {
  const fetchMock = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

beforeEach(() => {
  supabase.auth.getSession.mockResolvedValue({
    data: { session: { access_token: 'tok-123' } },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('inviteAdminUser', () => {
  it('poste email + rôle avec Bearer et X-Site-Id', async () => {
    const fetchMock = stubFetch(jsonResponse({ success: true, invited: true }))

    const data = await inviteAdminUser('nouveau@example.com', 'moderator')

    expect(data.invited).toBe(true)
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:3000/api/admin/users/invite')
    expect(options.method).toBe('POST')
    expect(options.headers.Authorization).toBe('Bearer tok-123')
    expect(options.headers['X-Site-Id']).toBe('sauvage-watches')
    expect(JSON.parse(options.body)).toEqual({ email: 'nouveau@example.com', role: 'moderator' })
  })

  it('remonte l’erreur backend', async () => {
    stubFetch(jsonResponse({ success: false, error: 'Rôle invalide' }, 400))
    await expect(inviteAdminUser('x@example.com', 'autre')).rejects.toThrow('Rôle invalide')
  })

  it('refuse sans session admin', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } })
    await expect(inviteAdminUser('x@example.com', 'admin')).rejects.toThrow(
      'Session admin requise',
    )
  })
})

describe('updateAdminUserRole', () => {
  it('PATCH le rôle avec l’email encodé dans l’URL', async () => {
    const fetchMock = stubFetch(jsonResponse({ success: true }))

    await updateAdminUserRole('user+tag@example.com', 'visitor')

    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:3000/api/admin/users/user%2Btag%40example.com')
    expect(options.method).toBe('PATCH')
    expect(JSON.parse(options.body)).toEqual({ role: 'visitor' })
  })
})

describe('deleteAdminUser', () => {
  it('DELETE sans corps', async () => {
    const fetchMock = stubFetch(jsonResponse({ success: true }))

    await deleteAdminUser('ancien@example.com')

    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:3000/api/admin/users/ancien%40example.com')
    expect(options.method).toBe('DELETE')
    expect(options.body).toBeUndefined()
  })

  it('remonte l’erreur du dernier administrateur', async () => {
    stubFetch(
      jsonResponse(
        { success: false, error: 'Impossible de supprimer le dernier administrateur' },
        400,
      ),
    )
    await expect(deleteAdminUser('seul-admin@example.com')).rejects.toThrow(
      'Impossible de supprimer le dernier administrateur',
    )
  })
})
