/**
 * Le listing public charge le catalogue entier depuis le navigateur. Deux plafonds PostgREST
 * le cassent en silence quand le catalogue grossit, sans jamais lever d'erreur :
 *
 *  - `max_rows` (1000 par défaut sur Supabase) tronque toute réponse non paginée ;
 *  - le filtre `.in(...)` voyage dans l'URL, qui devient trop longue au-delà de
 *    quelques centaines d'UUID.
 *
 * Ces tests verrouillent les deux parades (pagination explicite + découpage des IDs) sur
 * des volumes qui, sans elles, perdraient des montres ou des images sans rien signaler.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

/** Plafond de lignes appliqué en silence par PostgREST (`max_rows`, défaut Supabase). */
const MAX_ROWS = 1000

/** Au-delà, l'URL portant le filtre `.in(...)` est rejetée par la passerelle. */
const MAX_IDS_PER_REQUEST = 200

/** Requêtes vues par le faux client Supabase, dans l'ordre. */
let queries = []

/** @type {{ watches: Array<object>, watch_details: Array<object>, watch_images: Array<object>, watch_accessories: Array<object> }} */
let tables = {
  watches: [],
  watch_details: [],
  watch_images: [],
  watch_accessories: [],
}

/**
 * Faux constructeur de requête : accumule les appels chaînés, puis résout comme
 * PostgREST le ferait — filtre `in`, tranche `range`, **tronque à `max_rows` sans
 * le dire**, et rejette les URL trop longues. Ce sont ces deux derniers comportements
 * qui donnent leur valeur aux tests : sans eux, le code d'avant passerait aussi.
 */
function createQueryBuilder(table) {
  const state = { table, eq: {}, ids: null, from: 0, to: null }

  const builder = {
    select: () => builder,
    eq: (column, value) => {
      state.eq[column] = value
      return builder
    },
    in: (column, values) => {
      state.ids = values
      return builder
    },
    order: () => builder,
    limit: (count) => {
      state.to = state.from + count - 1
      return builder
    },
    range: (from, to) => {
      state.from = from
      state.to = to
      return builder
    },
    then: (resolve, reject) => {
      queries.push({ table, ids: state.ids, from: state.from, to: state.to })

      if (state.ids && state.ids.length > MAX_IDS_PER_REQUEST) {
        return Promise.resolve({
          data: null,
          error: { code: '414', message: 'Request-URI Too Large' },
        }).then(resolve, reject)
      }

      let rows = tables[table] ?? []
      for (const [column, value] of Object.entries(state.eq)) {
        rows = rows.filter((row) => row[column] === value)
      }
      if (state.ids) {
        const wanted = new Set(state.ids)
        rows = rows.filter((row) => wanted.has(row.watch_id))
      }
      const to = state.to ?? rows.length - 1
      rows = rows.slice(state.from, to + 1).slice(0, MAX_ROWS)

      return Promise.resolve({ data: rows, error: null }).then(resolve, reject)
    },
  }

  return builder
}

vi.mock('@/services/supabase', () => ({
  supabase: {
    from: (table) => createQueryBuilder(table),
    storage: {
      from: () => ({ getPublicUrl: () => ({ data: { publicUrl: '' } }) }),
    },
  },
}))

const { getAllWatchesForListing } = await import(
  '../../packages/base/src/services/watchService.js'
)

/** @param {number} count @param {number} imagesPerWatch */
function seedCatalog(count, imagesPerWatch = 1) {
  tables = { watches: [], watch_details: [], watch_images: [], watch_accessories: [] }

  for (let index = 0; index < count; index += 1) {
    const id = `watch-${String(index).padStart(4, '0')}`
    tables.watches.push({
      id,
      slug: id,
      ad_code: id,
      name: `Montre ${index}`,
      brand: 'Rolex',
      model: 'Submariner',
      reference: `REF-${index}`,
      price: 1000 + index,
      is_available: true,
      is_sold: false,
      display_order: null,
    })
    tables.watch_details.push({ watch_id: id, case_size: '40' })
    for (let order = 0; order < imagesPerWatch; order += 1) {
      tables.watch_images.push({
        watch_id: id,
        image_url: `https://example.test/${id}-${order}.jpg`,
        image_path: null,
        image_order: order,
      })
    }
  }
}

/** @param {string} table */
function queriesFor(table) {
  return queries.filter((query) => query.table === table)
}

describe('getAllWatchesForListing — pagination et découpage', () => {
  beforeEach(() => {
    queries = []
  })

  it('pagine les montres et rend le catalogue complet au-delà de max_rows', async () => {
    seedCatalog(1200)

    const watches = await getAllWatchesForListing()

    expect(watches).toHaveLength(1200)
    expect(new Set(watches.map((watch) => watch.id)).size).toBe(1200)

    // Aucune requête ne réclame plus de lignes que le plafond PostgREST le plus bas.
    for (const query of queriesFor('watches')) {
      expect(query.to - query.from + 1).toBeLessThanOrEqual(MAX_ROWS)
    }
  })

  it('sert une première page courte, puis élargit', async () => {
    seedCatalog(400)

    const pages = []
    await getAllWatchesForListing({ onPage: (page) => pages.push(page.length) })

    expect(pages).toEqual([60, 300, 40])
  })

  it('découpe les filtres `.in(...)` pour ne pas dépasser la longueur d’URL', async () => {
    seedCatalog(1200)

    await getAllWatchesForListing()

    const relationQueries = queries.filter((query) => query.ids !== null)
    expect(relationQueries.length).toBeGreaterThan(0)
    for (const query of relationQueries) {
      expect(query.ids.length).toBeLessThanOrEqual(MAX_IDS_PER_REQUEST)
    }
  })

  it('pagine aussi les relations : les dernières montres gardent leurs images', async () => {
    // 6 images par montre : un lot de 100 montres dépasse le plafond d’une seule réponse.
    seedCatalog(300, 6)

    const watches = await getAllWatchesForListing()

    expect(queriesFor('watch_images').length).toBeGreaterThan(3)
    for (const watch of watches) {
      expect(watch.images).toHaveLength(5) // plafonné à WATCH_CARD_MAX_IMAGES
    }
    expect(watches.at(-1).details.caseSize).toBe('40')
  })

  it('ne réclame rien de plus quand le catalogue est vide', async () => {
    seedCatalog(0)

    await expect(getAllWatchesForListing()).resolves.toEqual([])
    expect(queriesFor('watch_images')).toHaveLength(0)
  })
})
