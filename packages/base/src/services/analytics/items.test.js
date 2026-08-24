import { describe, expect, it, vi } from 'vitest'

vi.mock('@/site/getSiteConfig.js', () => ({
  getSiteConfig: () => ({ checkout: { currency: 'EUR' } }),
}))

import {
  centsToUnits,
  getCurrency,
  sumItemsValue,
  toGa4Item,
  toGa4ItemFromOrderLine,
  toGa4Items,
  toMetaContentIds,
  toMetaContents,
} from './items.js'

const WATCH = {
  id: '11111111-2222-3333-4444-555555555555',
  slug: 'rolex-submariner-16610',
  name: 'Rolex Submariner Date',
  brand: 'Rolex',
  model: 'Submariner',
  reference: '16610',
  price: 8690,
}

const CART_LINE = {
  watchId: '11111111-2222-3333-4444-555555555555',
  name: 'Rolex Submariner Date',
  reference: '16610',
  brand: 'Rolex',
  model: 'Submariner',
  price: 8690,
  quantity: 2,
}

describe('getCurrency', () => {
  it('vient de checkout.currency du site', () => {
    expect(getCurrency()).toBe('EUR')
  })
})

describe('centsToUnits', () => {
  it('convertit les centimes en unité monétaire', () => {
    expect(centsToUnits(869000)).toBe(8690)
    expect(centsToUnits(1250)).toBe(12.5)
    expect(centsToUnits(1)).toBe(0.01)
  })

  it('renvoie 0 pour une valeur absente ou non numérique', () => {
    expect(centsToUnits(undefined)).toBe(0)
    expect(centsToUnits(null)).toBe(0)
    expect(centsToUnits('abc')).toBe(0)
  })
})

describe('toGa4Item — montre du catalogue', () => {
  it('reprend la référence comme item_id et la marque comme item_brand', () => {
    expect(toGa4Item(WATCH)).toEqual({
      item_id: '16610',
      item_name: 'Rolex Submariner Date',
      item_brand: 'Rolex',
      item_variant: 'Submariner',
      price: 8690,
      quantity: 1,
    })
  })

  it('retombe sur l’identifiant quand la référence manque', () => {
    const item = toGa4Item({ ...WATCH, reference: null })
    expect(item.item_id).toBe(WATCH.id)
  })

  it('applique le prix promotionnel', () => {
    const item = toGa4Item({ ...WATCH, promotionPrice: 7900 })
    expect(item.price).toBe(7900)
  })

  it('écarte les champs vides plutôt que d’envoyer des chaînes vides', () => {
    const item = toGa4Item({ ...WATCH, brand: '', model: null })
    expect(item).not.toHaveProperty('item_brand')
    expect(item).not.toHaveProperty('item_variant')
  })

  it('renvoie null sans source', () => {
    expect(toGa4Item(null)).toBeNull()
  })
})

describe('toGa4Item — ligne de panier', () => {
  it('utilise watchId comme repli et conserve la quantité', () => {
    const item = toGa4Item({ ...CART_LINE, reference: null })
    expect(item.item_id).toBe(CART_LINE.watchId)
    expect(item.quantity).toBe(2)
  })

  it('lit le prix du panier en euros, sans conversion', () => {
    expect(toGa4Item(CART_LINE).price).toBe(8690)
  })

  it('la quantité passée en option prime sur celle de la ligne', () => {
    expect(toGa4Item(CART_LINE, { quantity: 1 }).quantity).toBe(1)
  })
})

describe('toGa4ItemFromOrderLine — ligne de commande', () => {
  it('convertit les centimes du backend (snake_case)', () => {
    const item = toGa4ItemFromOrderLine(
      {
        watch_id: 'abc',
        name: 'Rolex Submariner Date',
        reference: '16610',
        unit_price_cents: 869000,
        quantity: 2,
      },
      { index: 0 },
    )
    expect(item).toEqual({
      item_id: '16610',
      item_name: 'Rolex Submariner Date',
      price: 8690,
      quantity: 2,
      index: 0,
    })
  })

  it('accepte aussi la forme camelCase renvoyée par /api/orders', () => {
    const item = toGa4ItemFromOrderLine({
      watchId: 'abc',
      name: 'Montre',
      unitPriceCents: 125000,
      quantity: 1,
    })
    expect(item.price).toBe(1250)
    expect(item.item_id).toBe('abc')
  })
})

describe('toGa4Items', () => {
  it('indexe les items dans l’ordre et écarte les entrées vides', () => {
    const items = toGa4Items([WATCH, null, { ...WATCH, reference: 'X' }])
    expect(items.map((i) => i.index)).toEqual([0, 2])
  })

  it('accepte un mapper explicite pour les lignes de commande', () => {
    const items = toGa4Items([{ watch_id: 'a', name: 'A', unit_price_cents: 1000 }], toGa4ItemFromOrderLine)
    expect(items[0].price).toBe(10)
  })

  it('renvoie un tableau vide pour une entrée non itérable', () => {
    expect(toGa4Items(undefined)).toEqual([])
  })
})

describe('sumItemsValue', () => {
  it('multiplie par les quantités', () => {
    expect(sumItemsValue([{ price: 8690, quantity: 2 }, { price: 10.5, quantity: 1 }])).toBe(17390.5)
  })
})

describe('mapping Meta', () => {
  it('content_ids reprend les item_id GA4', () => {
    expect(toMetaContentIds(toGa4Items([WATCH]))).toEqual(['16610'])
  })

  it('contents porte quantité et prix unitaire', () => {
    expect(toMetaContents(toGa4Items([CART_LINE]))).toEqual([
      { id: '16610', quantity: 2, item_price: 8690 },
    ])
  })
})
