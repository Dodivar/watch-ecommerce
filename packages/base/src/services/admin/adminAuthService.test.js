import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: vi.fn(),
    },
  },
}))

import { supabase } from '../supabase'
import { requestAdminPasswordReset } from './adminAuthService.js'

const GENERIC_MESSAGE =
  'Si un compte existe pour cette adresse, un email de réinitialisation a été envoyé.'

beforeEach(() => {
  vi.stubGlobal('window', { location: { origin: 'http://localhost:5173' } })
  supabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('requestAdminPasswordReset', () => {
  it('envoie l’email de réinitialisation avec redirectTo vers /admin/set-password', async () => {
    const result = await requestAdminPasswordReset('admin@example.com')

    expect(result).toEqual({ success: true, message: GENERIC_MESSAGE })
    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('admin@example.com', {
      redirectTo: 'http://localhost:5173/admin/set-password',
    })
  })

  it('refuse une adresse email invalide sans appeler Supabase', async () => {
    const result = await requestAdminPasswordReset('pas-un-email')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Veuillez saisir une adresse email valide')
    expect(supabase.auth.resetPasswordForEmail).not.toHaveBeenCalled()
  })

  it('refuse une adresse email vide sans appeler Supabase', async () => {
    const result = await requestAdminPasswordReset('')

    expect(result.success).toBe(false)
    expect(supabase.auth.resetPasswordForEmail).not.toHaveBeenCalled()
  })

  it('normalise l’email (trim) avant envoi', async () => {
    await requestAdminPasswordReset('  admin@example.com  ')

    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      'admin@example.com',
      expect.anything(),
    )
  })

  it('retourne un message générique même si Supabase renvoie une erreur (anti-énumération)', async () => {
    supabase.auth.resetPasswordForEmail.mockResolvedValue({
      error: { status: 400, message: 'User not found' },
    })

    const result = await requestAdminPasswordReset('inconnu@example.com')

    expect(result).toEqual({ success: true, message: GENERIC_MESSAGE })
  })

  it('signale la limitation de débit (429)', async () => {
    supabase.auth.resetPasswordForEmail.mockResolvedValue({
      error: {
        status: 429,
        message: 'For security purposes, you can only request this after 60 seconds.',
      },
    })

    const result = await requestAdminPasswordReset('admin@example.com')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Trop de demandes. Veuillez patienter une minute avant de réessayer.')
  })

  it('retourne un succès générique si l’appel lève une exception', async () => {
    supabase.auth.resetPasswordForEmail.mockRejectedValue(new Error('network down'))

    const result = await requestAdminPasswordReset('admin@example.com')

    expect(result).toEqual({ success: true, message: GENERIC_MESSAGE })
  })
})
