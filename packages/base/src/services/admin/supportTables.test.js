import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./adminAuthService', () => ({
  getCurrentAdminRole: vi.fn(),
}))

import { getCurrentAdminRole } from './adminAuthService'
import { isMaskedSession, supportTable } from './supportTables.js'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('supportTable', () => {
  it('bascule les tables à données personnelles vers la vue masquée pour un visiteur', async () => {
    getCurrentAdminRole.mockResolvedValue('visitor')

    await expect(supportTable('orders')).resolves.toBe('orders_support')
    await expect(supportTable('lead_submissions')).resolves.toBe('lead_submissions_support')
  })

  it('laisse la table de base aux rôles en écriture', async () => {
    getCurrentAdminRole.mockResolvedValue('moderator')
    await expect(supportTable('orders')).resolves.toBe('orders')

    getCurrentAdminRole.mockResolvedValue('admin')
    await expect(supportTable('orders')).resolves.toBe('orders')
  })

  it('bascule aussi vers la vue masquée quand le rôle est indéterminé', async () => {
    // Échec fermé : viser la table de base donnerait un résultat vide sans
    // erreur, ce qui se lit comme « aucune commande » plutôt que comme un refus.
    getCurrentAdminRole.mockResolvedValue(null)
    await expect(supportTable('orders')).resolves.toBe('orders_support')
  })

  it('ne touche pas aux tables sans données personnelles', async () => {
    getCurrentAdminRole.mockResolvedValue('visitor')

    await expect(supportTable('watches')).resolves.toBe('watches')
    // Le rôle n'est même pas résolu : pas de requête inutile.
    expect(getCurrentAdminRole).not.toHaveBeenCalled()
  })
})

describe('isMaskedSession', () => {
  it('n’est vraie que pour le rôle visiteur', async () => {
    getCurrentAdminRole.mockResolvedValue('visitor')
    await expect(isMaskedSession()).resolves.toBe(true)

    getCurrentAdminRole.mockResolvedValue('admin')
    await expect(isMaskedSession()).resolves.toBe(false)

    getCurrentAdminRole.mockResolvedValue(null)
    await expect(isMaskedSession()).resolves.toBe(false)
  })
})
