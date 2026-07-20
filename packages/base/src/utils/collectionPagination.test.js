import { describe, expect, it } from 'vitest'

import { buildCollectionPaginationItems } from './collectionPagination.js'

function pages(items) {
  return items.map((i) => (i.type === 'ellipsis' ? '…' : i.n))
}

describe('buildCollectionPaginationItems — desktop', () => {
  it('retourne vide pour une seule page', () => {
    expect(buildCollectionPaginationItems(1, 1, false)).toEqual([])
    expect(buildCollectionPaginationItems(1, 0, false)).toEqual([])
  })

  it('liste toutes les pages jusqu’à 5 sans ellipse', () => {
    expect(pages(buildCollectionPaginationItems(3, 5, false))).toEqual([1, 2, 3, 4, 5])
    expect(pages(buildCollectionPaginationItems(1, 2, false))).toEqual([1, 2])
  })

  it('affiche une fenêtre autour de la page courante avec ellipses', () => {
    expect(pages(buildCollectionPaginationItems(10, 20, false))).toEqual([
      1, '…', 8, 9, 10, 11, 12, '…', 20,
    ])
  })

  it('étend la fenêtre en début de liste (pas d’ellipse orpheline)', () => {
    expect(pages(buildCollectionPaginationItems(1, 20, false))).toEqual([1, 2, 3, 4, 5, '…', 20])
    expect(pages(buildCollectionPaginationItems(4, 20, false))).toEqual([
      1, 2, 3, 4, 5, 6, '…', 20,
    ])
  })

  it('étend la fenêtre en fin de liste', () => {
    expect(pages(buildCollectionPaginationItems(20, 20, false))).toEqual([
      1, '…', 16, 17, 18, 19, 20,
    ])
    expect(pages(buildCollectionPaginationItems(18, 20, false))).toEqual([
      1, '…', 16, 17, 18, 19, 20,
    ])
  })

  it('la première et la dernière page sont toujours présentes', () => {
    for (let current = 1; current <= 30; current += 1) {
      const ns = pages(buildCollectionPaginationItems(current, 30, false)).filter(
        (p) => p !== '…',
      )
      expect(ns[0]).toBe(1)
      expect(ns[ns.length - 1]).toBe(30)
      expect(ns).toContain(current)
    }
  })
})

describe('buildCollectionPaginationItems — mobile (compact)', () => {
  it('début de liste : 1, 2, 3 et la dernière, sans ellipse', () => {
    const items = buildCollectionPaginationItems(1, 20, true)
    expect(pages(items)).toEqual([1, 2, 3, 20])
    expect(items.every((i) => i.type === 'page')).toBe(true)
  })

  it('milieu de liste : fenêtre resserrée autour de la page courante', () => {
    expect(pages(buildCollectionPaginationItems(10, 20, true))).toEqual([1, 9, 10, 11, 20])
  })

  it('fin de liste : trois dernières pages', () => {
    expect(pages(buildCollectionPaginationItems(20, 20, true))).toEqual([1, 18, 19, 20])
    expect(pages(buildCollectionPaginationItems(19, 20, true))).toEqual([1, 18, 19, 20])
  })

  it('liste courte : toutes les pages', () => {
    expect(pages(buildCollectionPaginationItems(2, 4, true))).toEqual([1, 2, 3, 4])
  })
})
