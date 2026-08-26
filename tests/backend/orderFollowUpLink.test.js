/**
 * Lien de suivi durable envoyé dans l'email de confirmation.
 *
 * Ce que ces tests protègent :
 * 1. le lien survit largement à l'onglet de checkout (le token de commande expirait en 2 h,
 *    l'acheteur perdait alors l'accès à sa commande et à son reçu) ;
 * 2. il n'ouvre que la lecture — un porteur du lien ne peut ni modifier, ni payer, ni annuler ;
 * 3. un échec d'écriture du hash fait partir l'email sans lien plutôt qu'avec un lien mort.
 */
import { createRequire } from 'node:module'
import { describe, expect, it, vi } from 'vitest'

const require = createRequire(import.meta.url)
const { requireOrderAccess, mintOrderFollowUpUrl } = require('../../backend/routes/orders.js')
const {
  signOrderAccessToken,
  hashOrderAccessToken,
  verifyOrderAccessToken,
  DEFAULT_TTL_SECONDS,
  FOLLOW_UP_TTL_SECONDS,
} = require('../../backend/orders/tokens.js')
const { buildOrderFollowUpUrl } = require('../../backend/orders/orderLinks.js')
const {
  createOrderConfirmationEmail,
} = require('../../backend/templates/orderConfirmationEmail.js')

const SECRET = 'test-secret'
const ORDER_ID = 'o42'

function makeSite(overrides = {}) {
  return {
    id: 'demo-store',
    secrets: { paymentCancelSecret: SECRET },
    config: {
      urls: { production: 'https://demo-store.fr' },
      backend: {
        email: {
          fromName: 'Demo Store',
          template: { accentColor: '#111111', logoText: 'DEMO' },
        },
      },
      ...overrides,
    },
  }
}

/** Supabase minimal : ne sait qu'écrire sur `orders`. */
function mockSupabase({ updateError = null } = {}) {
  const updates = []
  const chain = {
    update: vi.fn((payload) => {
      updates.push(payload)
      return chain
    }),
    eq: vi.fn(async () => ({ error: updateError })),
  }
  return { supabase: { from: vi.fn(() => chain) }, updates }
}

describe('FOLLOW_UP_TTL_SECONDS', () => {
  it("couvre la durée de conservation du reçu, pas la fenêtre de checkout", () => {
    expect(FOLLOW_UP_TTL_SECONDS).toBe(60 * 60 * 24 * 365 * 10)
    expect(FOLLOW_UP_TTL_SECONDS).toBeGreaterThan(DEFAULT_TTL_SECONDS)
  })

  it('signe un token encore valide bien après la fin de la session de checkout', () => {
    const token = signOrderAccessToken(SECRET, ORDER_ID, FOLLOW_UP_TTL_SECONDS)
    const sixMonths = 1000 * 60 * 60 * 24 * 182

    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date(Date.now() + sixMonths))
      expect(verifyOrderAccessToken(SECRET, token, ORDER_ID)).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it('laisse le token de checkout expirer en 2 h comme avant', () => {
    const token = signOrderAccessToken(SECRET, ORDER_ID)
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date(Date.now() + (DEFAULT_TTL_SECONDS + 60) * 1000))
      expect(verifyOrderAccessToken(SECRET, token, ORDER_ID)).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('mintOrderFollowUpUrl', () => {
  it('persiste le hash et renvoie un lien dont le token correspond', async () => {
    const site = makeSite()
    const { supabase, updates } = mockSupabase()

    const url = await mintOrderFollowUpUrl(supabase, site, ORDER_ID)

    expect(updates).toHaveLength(1)
    const parsed = new URL(url)
    expect(parsed.origin + parsed.pathname).toBe('https://demo-store.fr/commande/suivi')
    expect(parsed.searchParams.get('order')).toBe(ORDER_ID)
    const token = parsed.searchParams.get('token')
    expect(verifyOrderAccessToken(SECRET, token, ORDER_ID)).toBe(true)
    expect(updates[0].followup_token_hash).toBe(hashOrderAccessToken(token))
  })

  it("ne renvoie pas de lien si le hash n'a pas pu être écrit (lien mort évité)", async () => {
    const site = makeSite()
    const { supabase } = mockSupabase({ updateError: new Error('column missing') })
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(mintOrderFollowUpUrl(supabase, site, ORDER_ID)).resolves.toBeNull()
  })

  it("ne renvoie pas de lien si le site n'expose aucune URL publique", async () => {
    const site = makeSite({ urls: {} })
    const { supabase, updates } = mockSupabase()

    await expect(mintOrderFollowUpUrl(supabase, site, ORDER_ID)).resolves.toBeNull()
    expect(updates).toHaveLength(0) // Rien d'écrit pour un lien qu'on n'enverra pas.
  })

  it('ne renvoie pas de lien sans secret de signature', async () => {
    const site = { ...makeSite(), secrets: {} }
    const { supabase } = mockSupabase()

    await expect(mintOrderFollowUpUrl(supabase, site, ORDER_ID)).resolves.toBeNull()
  })
})

describe('requireOrderAccess — portée du token de suivi', () => {
  const followUpToken = signOrderAccessToken(SECRET, ORDER_ID, FOLLOW_UP_TTL_SECONDS)
  const checkoutToken = signOrderAccessToken(SECRET, ORDER_ID)

  const paidOrder = {
    id: ORDER_ID,
    status: 'paid',
    access_token_hash: hashOrderAccessToken(checkoutToken),
    followup_token_hash: hashOrderAccessToken(followUpToken),
  }

  it('accepte le token de suivi sur une route en lecture seule', () => {
    const access = requireOrderAccess(makeSite(), paidOrder, followUpToken, {
      allowFollowUp: true,
    })
    expect(access.ok).toBe(true)
  })

  it('refuse le token de suivi partout ailleurs (modification, paiement, annulation)', () => {
    const access = requireOrderAccess(makeSite(), paidOrder, followUpToken)
    expect(access.ok).toBe(false)
    expect(access.status).toBe(403)
  })

  it("n'invalide pas le token d'origine du checkout", () => {
    expect(requireOrderAccess(makeSite(), paidOrder, checkoutToken).ok).toBe(true)
    expect(
      requireOrderAccess(makeSite(), paidOrder, checkoutToken, { allowFollowUp: true }).ok,
    ).toBe(true)
  })

  it("refuse un token signé avec un autre secret, même en lecture", () => {
    const forged = signOrderAccessToken('autre-secret', ORDER_ID, FOLLOW_UP_TTL_SECONDS)
    const access = requireOrderAccess(makeSite(), paidOrder, forged, { allowFollowUp: true })
    expect(access.ok).toBe(false)
    expect(access.status).toBe(403)
  })

  it("refuse un token de suivi valide émis pour une autre commande", () => {
    const otherToken = signOrderAccessToken(SECRET, 'o99', FOLLOW_UP_TTL_SECONDS)
    const access = requireOrderAccess(makeSite(), paidOrder, otherToken, { allowFollowUp: true })
    expect(access.ok).toBe(false)
  })
})

describe('buildOrderFollowUpUrl', () => {
  it('pointe sur la page de suivi de la vitrine', () => {
    expect(buildOrderFollowUpUrl(makeSite(), 'o42', 'tok.sig')).toBe(
      'https://demo-store.fr/commande/suivi?order=o42&token=tok.sig',
    )
  })
})

describe("email de confirmation", () => {
  const order = { id: ORDER_ID, subtotal_cents: 850000, shipping_cents: 0, total_cents: 850000 }
  const followUpUrl = 'https://demo-store.fr/commande/suivi?order=o42&token=tok.sig'

  it('porte le lien de suivi dans l\'email client', () => {
    const html = createOrderConfirmationEmail(makeSite(), order, [], false, { followUpUrl })
    expect(html).toContain('Suivre votre commande')
    expect(html).toContain('https://demo-store.fr/commande/suivi?order=o42&amp;token=tok.sig')
  })

  it("n'envoie pas le lien au commerçant", () => {
    const html = createOrderConfirmationEmail(makeSite(), order, [], true, { followUpUrl })
    expect(html).not.toContain('/commande/suivi')
  })

  it("reste envoyable sans lien (hash non écrit)", () => {
    const html = createOrderConfirmationEmail(makeSite(), order, [], false, {
      followUpUrl: null,
    })
    expect(html).not.toContain('Suivre votre commande')
    expect(html).toContain(ORDER_ID)
  })
})
