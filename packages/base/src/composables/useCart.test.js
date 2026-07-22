// @vitest-environment happy-dom

import { nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const siteConfigHolder = vi.hoisted(() => ({
  current: { siteId: 'site-test', features: {} },
}))

vi.mock('@/site/getSiteConfig.js', () => ({
  getSiteConfig: () => siteConfigHolder.current,
}))

async function loadCart(config = { siteId: 'site-test', features: {} }) {
  siteConfigHolder.current = config
  vi.resetModules()
  const { useCart } = await import('./useCart.js')
  return useCart()
}

function line(id, price = 100, extra = {}) {
  return { watchId: id, name: `Montre ${id}`, price, ...extra }
}

beforeEach(() => {
  localStorage.clear()
})

describe('useCart — mode mono-quantité (défaut)', () => {
  it('ajoute une ligne et met à jour compteur, badge et total', async () => {
    const cart = await loadCart()
    const result = cart.add(line('w1', 1500))

    expect(result).toEqual({ ok: true })
    expect(cart.itemCount.value).toBe(1)
    expect(cart.badgeLabel.value).toBe('1')
    expect(cart.totalPrice.value).toBe(1500)
  })

  it('refuse une ligne sans watchId ou sans nom', async () => {
    const cart = await loadCart()

    expect(cart.add({ name: 'Sans id', price: 10 }).ok).toBe(false)
    expect(cart.add({ watchId: 'w1', price: 10 }).ok).toBe(false)
    expect(cart.itemCount.value).toBe(0)
  })

  it('remplace la ligne existante au lieu de dupliquer', async () => {
    const cart = await loadCart()
    cart.add(line('w1', 100))
    cart.add(line('w1', 250))

    expect(cart.items.value).toHaveLength(1)
    expect(cart.items.value[0].price).toBe(250)
    expect(cart.items.value[0].quantity).toBe(1)
  })

  it('limite le panier à MAX_CART_LINES montres', async () => {
    const cart = await loadCart()
    for (let i = 0; i < cart.MAX_CART_LINES; i += 1) {
      expect(cart.add(line(`w${i}`)).ok).toBe(true)
    }

    const rejected = cart.add(line('w-extra'))
    expect(rejected.ok).toBe(false)
    expect(rejected.reason).toContain(String(cart.MAX_CART_LINES))
    expect(cart.items.value).toHaveLength(cart.MAX_CART_LINES)
  })

  it('affiche 9+ sur le badge au-delà de 9 articles', async () => {
    const cart = await loadCart()
    for (let i = 0; i < 10; i += 1) cart.add(line(`w${i}`))

    expect(cart.badgeLabel.value).toBe('9+')
  })

  it('badge vide quand le panier est vide', async () => {
    const cart = await loadCart()
    expect(cart.badgeLabel.value).toBe('')
  })

  it('remove retire la ligne ciblée, clear vide le panier', async () => {
    const cart = await loadCart()
    cart.add(line('w1'))
    cart.add(line('w2'))

    cart.remove('w1')
    expect(cart.items.value.map((r) => r.watchId)).toEqual(['w2'])

    cart.clear()
    expect(cart.items.value).toEqual([])
  })

  it('persiste le panier dans localStorage par site et le recharge', async () => {
    const cart = await loadCart({ siteId: 'site-a', features: {} })
    cart.clear()
    cart.add(line('w1', 900))
    await nextTick()

    const raw = localStorage.getItem('watch_cart:site-a')
    expect(raw).toBeTruthy()
    expect(JSON.parse(raw)[0]).toMatchObject({ watchId: 'w1', price: 900 })

    const reloaded = await loadCart({ siteId: 'site-a', features: {} })
    expect(reloaded.items.value).toHaveLength(1)
    expect(reloaded.items.value[0]).toMatchObject({ watchId: 'w1', price: 900, quantity: 1 })
  })

  it('ignore un stockage corrompu ou de mauvais format', async () => {
    localStorage.setItem('watch_cart:site-b', 'pas-du-json{')
    let cart = await loadCart({ siteId: 'site-b', features: {} })
    expect(cart.items.value).toEqual([])

    localStorage.setItem('watch_cart:site-c', JSON.stringify({ watchId: 'w1' }))
    cart = await loadCart({ siteId: 'site-c', features: {} })
    expect(cart.items.value).toEqual([])
  })

  it('filtre les lignes invalides et dédoublonne au chargement', async () => {
    localStorage.setItem(
      'watch_cart:site-d',
      JSON.stringify([
        { watchId: 'w1', name: 'A', price: 100, quantity: 5 },
        { watchId: 'w1', name: 'A bis', price: 120 },
        { watchId: 'w2', name: 'B', price: 'gratuit' },
        { name: 'sans id', price: 10 },
      ]),
    )
    const cart = await loadCart({ siteId: 'site-d', features: {} })

    expect(cart.items.value).toHaveLength(1)
    expect(cart.items.value[0]).toMatchObject({ watchId: 'w1', name: 'A bis', quantity: 1 })
  })

  it('getCheckoutLines force la quantité à 1', async () => {
    const cart = await loadCart()
    cart.add(line('w1'))

    expect(cart.getCheckoutLines()).toEqual([{ watchId: 'w1', quantity: 1 }])
  })

  it('replaceItems filtre les lignes invalides et force quantité 1', async () => {
    const cart = await loadCart()
    cart.replaceItems([
      { watchId: 'w1', name: 'A', price: '150', quantity: 4 },
      { watchId: 'w2', name: 'B' },
      { name: 'sans id' },
      null,
    ])

    expect(cart.items.value).toHaveLength(2)
    expect(cart.items.value[0]).toMatchObject({ watchId: 'w1', price: 150, quantity: 1 })
    expect(cart.items.value[1]).toMatchObject({ watchId: 'w2', price: 0, quantity: 1 })
  })

  it('replaceItems tronque au-delà de MAX_CART_LINES', async () => {
    const cart = await loadCart()
    const rows = Array.from({ length: 15 }, (_, i) => line(`w${i}`))
    cart.replaceItems(rows)

    expect(cart.items.value).toHaveLength(cart.MAX_CART_LINES)
  })

  it('gère l’ouverture/fermeture du tiroir', async () => {
    const cart = await loadCart()
    expect(cart.drawerOpen.value).toBe(false)

    cart.openDrawer()
    expect(cart.drawerOpen.value).toBe(true)

    cart.toggleDrawer()
    expect(cart.drawerOpen.value).toBe(false)

    cart.toggleDrawer()
    cart.closeDrawer()
    expect(cart.drawerOpen.value).toBe(false)
  })
})

describe('useCart — feature cartMultiQuantity', () => {
  const multiConfig = () => ({ siteId: 'site-multi', features: { cartMultiQuantity: true } })

  it('incrémente la quantité quand on rajoute la même montre', async () => {
    const cart = await loadCart(multiConfig())
    cart.add(line('w1', 200))
    cart.add(line('w1', 200))

    expect(cart.items.value).toHaveLength(1)
    expect(cart.items.value[0].quantity).toBe(2)
    expect(cart.itemCount.value).toBe(2)
    expect(cart.totalPrice.value).toBe(400)
  })

  it('refuse d’ajouter au-delà de MAX_CART_UNITS unités', async () => {
    const cart = await loadCart(multiConfig())
    for (let i = 0; i < cart.MAX_CART_UNITS; i += 1) {
      expect(cart.add(line('w1')).ok).toBe(true)
    }

    const rejected = cart.add(line('w1'))
    expect(rejected.ok).toBe(false)
    expect(rejected.reason).toContain(String(cart.MAX_CART_UNITS))

    const rejectedNew = cart.add(line('w2'))
    expect(rejectedNew.ok).toBe(false)
  })

  it('incrementQuantity/decrementQuantity ajustent la ligne', async () => {
    const cart = await loadCart(multiConfig())
    cart.add(line('w1'))

    cart.incrementQuantity('w1')
    expect(cart.items.value[0].quantity).toBe(2)

    cart.decrementQuantity('w1')
    expect(cart.items.value[0].quantity).toBe(1)
  })

  it('decrementQuantity retire la ligne à quantité 1', async () => {
    const cart = await loadCart(multiConfig())
    cart.add(line('w1'))

    cart.decrementQuantity('w1')
    expect(cart.items.value).toEqual([])
  })

  it('incrementQuantity respecte le plafond global d’unités', async () => {
    const cart = await loadCart(multiConfig())
    for (let i = 0; i < cart.MAX_CART_UNITS; i += 1) cart.add(line('w1'))

    cart.incrementQuantity('w1')
    expect(cart.itemCount.value).toBe(cart.MAX_CART_UNITS)
  })

  it('ignore increment/decrement sur une montre absente', async () => {
    const cart = await loadCart(multiConfig())
    cart.add(line('w1'))

    cart.incrementQuantity('inconnue')
    cart.decrementQuantity('inconnue')
    expect(cart.items.value).toHaveLength(1)
    expect(cart.items.value[0].quantity).toBe(1)
  })

  it('getWatchIds répète les ids selon la quantité', async () => {
    const cart = await loadCart(multiConfig())
    cart.add(line('w1'))
    cart.add(line('w1'))
    cart.add(line('w2'))

    expect(cart.getWatchIds()).toEqual(['w1', 'w1', 'w2'])
    expect(cart.getCheckoutLines()).toEqual([
      { watchId: 'w1', quantity: 2 },
      { watchId: 'w2', quantity: 1 },
    ])
  })

  it('replaceItems conserve les quantités valides', async () => {
    const cart = await loadCart(multiConfig())
    cart.replaceItems([
      { watchId: 'w1', name: 'A', price: 100, quantity: 3 },
      { watchId: 'w2', name: 'B', price: 50, quantity: 0 },
    ])

    expect(cart.items.value[0].quantity).toBe(3)
    // quantité invalide (< 1) ramenée à 1
    expect(cart.items.value[1].quantity).toBe(1)
  })

  it('recharge les quantités depuis localStorage', async () => {
    localStorage.setItem(
      'watch_cart:site-multi',
      JSON.stringify([{ watchId: 'w1', name: 'A', price: 100, quantity: 4 }]),
    )
    const cart = await loadCart(multiConfig())

    expect(cart.items.value[0].quantity).toBe(4)
    expect(cart.itemCount.value).toBe(4)
  })
})
