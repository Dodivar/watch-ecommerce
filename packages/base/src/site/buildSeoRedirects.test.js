import { describe, expect, it } from 'vitest'

import {
  buildAllSeoRedirects,
  buildPrestashopLegacyRedirects,
  buildWatchLegacyRedirects,
} from './buildSeoRedirects.js'

describe('buildSeoRedirects', () => {
  it('redirige /watch/:id vers /montre/:slug', () => {
    const redirects = buildWatchLegacyRedirects([
      {
        id: 'uuid-1',
        brand: 'Rolex',
        name: 'Daytona',
        reference: '116500LN',
      },
    ])

    expect(redirects).toEqual([
      {
        source: '/watch/uuid-1',
        destination: '/montre/rolex-daytona-116500ln',
        permanent: true,
      },
    ])
  })

  it('inclut les motifs PrestaShop du manifest', () => {
    const redirects = buildPrestashopLegacyRedirects({
      seo: {
        legacyRedirects: {
          prestashop: {
            productPattern: '/:prestashopId(\\d+)-:rewrite.html',
            productDestination: '/montre/:rewrite',
            categoryPattern: '/:prestashopId(\\d+)-:rewrite',
            categoryDestination: '/collection/:rewrite',
          },
          static: [{ source: '/contactez-nous', destination: '/contact' }],
        },
      },
    })

    expect(redirects).toHaveLength(3)
    expect(redirects[2]).toMatchObject({
      source: '/contactez-nous',
      destination: '/contact',
      permanent: true,
    })
  })

  it('fusionne sans doublons', () => {
    const redirects = buildAllSeoRedirects(
      {
        seo: {
          legacyRedirects: {
            static: [{ source: '/contactez-nous', destination: '/contact' }],
          },
        },
      },
      [
        { id: '1', brand: 'Omega', name: 'Speedmaster' },
        { id: '1', brand: 'Omega', name: 'Speedmaster' },
      ],
    )

    expect(redirects.filter((r) => r.source === '/watch/1')).toHaveLength(1)
  })
})
