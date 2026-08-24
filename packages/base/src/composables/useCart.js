import { ref, computed, watch } from 'vue'
import { getSiteConfig } from '@/site/getSiteConfig.js'

/**
 * `brand` et `model` ne servent pas à l'affichage du panier : ils accompagnent la ligne
 * jusqu'aux événements de mesure (`item_brand`, `item_variant`), où la marque est la
 * dimension la plus parlante d'un catalogue de montres.
 * @typedef {{ watchId: string, name: string, reference?: string|null, brand?: string|null, model?: string|null, price: number, imageUrl?: string|null, quantity?: number }} CartLine
 */

const MAX_CART_LINES = 10
const MAX_CART_UNITS = 10
const MAX_QTY_PER_LINE = 99

const items = ref(/** @type {CartLine[]} */ ([]))
const drawerOpen = ref(false)

let boundSiteId = null

function isCartMultiQuantityFeature() {
  return Boolean(getSiteConfig().features?.cartMultiQuantity)
}

function lineQuantity(line) {
  const q = Number(line?.quantity)
  if (!Number.isFinite(q) || q < 1) return 1
  return Math.min(MAX_QTY_PER_LINE, Math.floor(q))
}

function totalUnits(lines) {
  return lines.reduce((sum, row) => sum + lineQuantity(row), 0)
}

function storageKey() {
  const site = getSiteConfig()
  const id = site.siteId || site.id || 'default'
  return `watch_cart:${id}`
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(storageKey())
    if (!raw) {
      items.value = []
      return
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      items.value = []
      return
    }
    const rawLines = parsed
      .filter(
        (row) =>
          row &&
          typeof row.watchId === 'string' &&
          typeof row.name === 'string' &&
          typeof row.price === 'number',
      )
      .map((row) => ({
        watchId: row.watchId,
        name: row.name,
        reference: row.reference ?? null,
        brand: row.brand ?? null,
        model: row.model ?? null,
        price: row.price,
        imageUrl: row.imageUrl ?? null,
        quantity: lineQuantity(row),
      }))

    if (isCartMultiQuantityFeature()) {
      items.value = rawLines.map((row) => ({ ...row, quantity: lineQuantity(row) }))
      return
    }

    const dedup = new Map()
    for (const row of rawLines) {
      dedup.set(row.watchId, { ...row, quantity: 1 })
    }
    items.value = [...dedup.values()]
  } catch {
    items.value = []
  }
}

function persist() {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(items.value))
  } catch {
    /* ignore quota */
  }
}

function ensureSite() {
  const site = getSiteConfig()
  const id = site.siteId || site.id || 'default'
  if (boundSiteId !== id) {
    boundSiteId = id
    loadFromStorage()
  }
}

watch(
  items,
  () => {
    ensureSite()
    persist()
  },
  { deep: true },
)

export function useCart() {
  ensureSite()

  const cartMultiQuantity = computed(() => isCartMultiQuantityFeature())

  const itemCount = computed(() => {
    if (cartMultiQuantity.value) {
      return totalUnits(items.value)
    }
    return items.value.length
  })

  const badgeLabel = computed(() => {
    const n = itemCount.value
    if (n > 9) return '9+'
    return n > 0 ? String(n) : ''
  })

  const totalPrice = computed(() =>
    items.value.reduce(
      (sum, line) => sum + (Number(line.price) || 0) * lineQuantity(line),
      0,
    ),
  )

  /**
   * @param {CartLine} line
   * @returns {{ ok: true } | { ok: false, reason: string }}
   */
  function add(line) {
    ensureSite()
    if (!line.watchId || !line.name) {
      return { ok: false, reason: 'Données produit incomplètes' }
    }
    const multi = cartMultiQuantity.value
    const idx = items.value.findIndex((r) => r.watchId === line.watchId)

    if (multi) {
      if (idx >= 0) {
        const cur = lineQuantity(items.value[idx])
        if (cur >= MAX_QTY_PER_LINE) {
          return { ok: false, reason: `Quantité maximale (${MAX_QTY_PER_LINE}) atteinte pour cet article` }
        }
        if (totalUnits(items.value) >= MAX_CART_UNITS) {
          return {
            ok: false,
            reason: `Le panier est limité à ${MAX_CART_UNITS} article${MAX_CART_UNITS > 1 ? 's' : ''}`,
          }
        }
        items.value.splice(idx, 1, {
          ...items.value[idx],
          ...line,
          quantity: cur + 1,
        })
        return { ok: true }
      }
      if (items.value.length >= MAX_CART_LINES) {
        return { ok: false, reason: `Le panier est limité à ${MAX_CART_LINES} références différentes` }
      }
      if (totalUnits(items.value) >= MAX_CART_UNITS) {
        return {
          ok: false,
          reason: `Le panier est limité à ${MAX_CART_UNITS} article${MAX_CART_UNITS > 1 ? 's' : ''}`,
        }
      }
      items.value.push({ ...line, quantity: 1 })
      return { ok: true }
    }

    if (idx >= 0) {
      items.value.splice(idx, 1, { ...line, quantity: 1 })
      return { ok: true }
    }
    if (items.value.length >= MAX_CART_LINES) {
      return { ok: false, reason: `Le panier est limité à ${MAX_CART_LINES} montres` }
    }
    items.value.push({ ...line, quantity: 1 })
    return { ok: true }
  }

  /** @param {string} watchId */
  function incrementQuantity(watchId) {
    ensureSite()
    if (!cartMultiQuantity.value) return
    const idx = items.value.findIndex((r) => r.watchId === watchId)
    if (idx < 0) return
    const cur = lineQuantity(items.value[idx])
    if (cur >= MAX_QTY_PER_LINE) return
    if (totalUnits(items.value) >= MAX_CART_UNITS) return
    items.value.splice(idx, 1, {
      ...items.value[idx],
      quantity: cur + 1,
    })
  }

  /** @param {string} watchId */
  function decrementQuantity(watchId) {
    ensureSite()
    if (!cartMultiQuantity.value) return
    const idx = items.value.findIndex((r) => r.watchId === watchId)
    if (idx < 0) return
    const cur = lineQuantity(items.value[idx])
    if (cur <= 1) {
      items.value.splice(idx, 1)
      return
    }
    items.value.splice(idx, 1, {
      ...items.value[idx],
      quantity: cur - 1,
    })
  }

  /** @param {string} watchId */
  function remove(watchId) {
    ensureSite()
    const idx = items.value.findIndex((r) => r.watchId === watchId)
    if (idx >= 0) {
      items.value.splice(idx, 1)
    }
  }

  function clear() {
    ensureSite()
    items.value = []
  }

  /**
   * Remplace tout le panier (reprise d'une commande via lien de relance).
   * @param {CartLine[]} lines
   */
  function replaceItems(lines) {
    ensureSite()
    const rows = (Array.isArray(lines) ? lines : [])
      .filter((row) => row && typeof row.watchId === 'string' && typeof row.name === 'string')
      .slice(0, MAX_CART_LINES)
      .map((row) => ({
        watchId: row.watchId,
        name: row.name,
        reference: row.reference ?? null,
        brand: row.brand ?? null,
        model: row.model ?? null,
        price: Number(row.price) || 0,
        imageUrl: row.imageUrl ?? null,
        quantity: cartMultiQuantity.value ? lineQuantity(row) : 1,
      }))
    items.value = rows
  }

  /** @returns {string[]} ids répétés selon la quantité (legacy / usages internes) */
  function getWatchIds() {
    const out = []
    for (const r of items.value) {
      const n = cartMultiQuantity.value ? lineQuantity(r) : 1
      for (let i = 0; i < n; i += 1) {
        out.push(r.watchId)
      }
    }
    return out
  }

  /** @returns {{ watchId: string, quantity: number }[]} */
  function getCheckoutLines() {
    return items.value.map((r) => ({
      watchId: r.watchId,
      quantity: cartMultiQuantity.value ? lineQuantity(r) : 1,
    }))
  }

  function openDrawer() {
    drawerOpen.value = true
  }

  function closeDrawer() {
    drawerOpen.value = false
  }

  function toggleDrawer() {
    drawerOpen.value = !drawerOpen.value
  }

  return {
    items,
    itemCount,
    badgeLabel,
    totalPrice,
    add,
    remove,
    incrementQuantity,
    decrementQuantity,
    clear,
    replaceItems,
    getWatchIds,
    getCheckoutLines,
    cartMultiQuantity,
    drawerOpen,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    MAX_CART_LINES,
    MAX_CART_UNITS,
  }
}
