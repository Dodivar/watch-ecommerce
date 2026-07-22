import { describe, expect, it } from 'vitest'

import {
  ADMIN_ROLES,
  ROLE_LABELS,
  canAccessPath,
  canManageUsers,
  canWrite,
  deniedTooltip,
  isAdminOnlyPath,
} from './adminPermissions.js'

describe('isAdminOnlyPath', () => {
  it.each([
    '/admin/users',
    '/admin/promo',
    '/admin/promo/new',
    '/admin/promo/abc/edit',
    '/admin/watch-promotions',
    '/admin/watch-promotions/x/review',
    '/admin/home-carousel',
    '/admin/home-featured',
    '/admin/home-collection',
  ])('réserve %s à l’admin', (path) => {
    expect(isAdminOnlyPath(path)).toBe(true)
  })

  it.each(['/admin', '/admin/watches', '/admin/promotions-autre', '/admin/promotion'])(
    'laisse %s hors du périmètre admin-only (frontière de segment)',
    (path) => {
      expect(isAdminOnlyPath(path)).toBe(false)
    },
  )
})

describe('canAccessPath', () => {
  const cases = [
    // [role, path, expected]
    ['admin', '/admin/users', true],
    ['admin', '/admin/promo/new', true],
    ['admin', '/admin/watches/abc/edit', true],
    ['moderator', '/admin', true],
    ['moderator', '/admin/watches', true],
    ['moderator', '/admin/watches/new', true],
    ['moderator', '/admin/watches/abc/edit', true],
    ['moderator', '/admin/orders', true],
    ['moderator', '/admin/leads/123', true],
    ['moderator', '/admin/articles/generate', true],
    ['moderator', '/admin/newsletter/compose', true],
    ['moderator', '/admin/newsletter/settings', true],
    ['moderator', '/admin/stats', true],
    ['moderator', '/admin/users', false],
    ['moderator', '/admin/promo', false],
    ['moderator', '/admin/watch-promotions/x/review', false],
    ['moderator', '/admin/home-carousel', false],
    ['visitor', '/admin', true],
    ['visitor', '/admin/watches', true],
    ['visitor', '/admin/orders', true],
    ['visitor', '/admin/leads/123', true],
    ['visitor', '/admin/newsletter/settings', true],
    ['visitor', '/admin/stats', true],
    ['visitor', '/admin/watches/new', false],
    ['visitor', '/admin/watches/abc/edit', false],
    ['visitor', '/admin/articles/generate', false],
    ['visitor', '/admin/newsletter/compose', false],
    ['visitor', '/admin/newsletter/abc/edit', false],
    ['visitor', '/admin/users', false],
    ['visitor', '/admin/promo', false],
    ['visitor', '/admin/home-featured', false],
  ]

  it.each(cases)('%s → %s : %s', (role, path, expected) => {
    expect(canAccessPath(role, path)).toBe(expected)
  })

  it('refuse tout rôle inconnu ou absent', () => {
    expect(canAccessPath(null, '/admin')).toBe(false)
    expect(canAccessPath('autre', '/admin/watches')).toBe(false)
  })
})

describe('canWrite / canManageUsers', () => {
  it('autorise l’écriture pour admin et moderator uniquement', () => {
    expect(canWrite('admin')).toBe(true)
    expect(canWrite('moderator')).toBe(true)
    expect(canWrite('visitor')).toBe(false)
    expect(canWrite(null)).toBe(false)
  })

  it('réserve la gestion des utilisateurs à l’admin', () => {
    expect(canManageUsers('admin')).toBe(true)
    expect(canManageUsers('moderator')).toBe(false)
    expect(canManageUsers('visitor')).toBe(false)
  })
})

describe('deniedTooltip / constantes', () => {
  it('explique les sections réservées à l’admin', () => {
    expect(deniedTooltip('moderator', '/admin/promo')).toBe('Accès réservé à l’administrateur')
    expect(deniedTooltip('visitor', '/admin/users')).toBe('Accès réservé à l’administrateur')
  })

  it('explique la lecture seule pour un visiteur hors sections admin', () => {
    expect(deniedTooltip('visitor', '/admin/watches/new')).toBe('Compte en lecture seule')
  })

  it('a un libellé pour chaque rôle', () => {
    for (const role of ADMIN_ROLES) {
      expect(ROLE_LABELS[role]).toBeTruthy()
    }
  })
})
