import { describe, expect, it, vi } from 'vitest'

// `@/config` lit le manifest complet au chargement ; le stub de site des tests n'a pas de bloc
// `contact`. Seul `BASE_URL` est utilisé ici (URL absolue du logo de la bulle).
vi.mock('@/config', () => ({ BASE_URL: 'https://example.test' }))

import { buildStoreMapPopupHtml } from './buildStoreMapPopupHtml.js'

const BASE = { title: 'Place des Montres', addressHtml: '24 Place des Halles' }

describe('buildStoreMapPopupHtml — bulle sans avis', () => {
  it('ne rend aucune ligne de note quand la note est absente', () => {
    const html = buildStoreMapPopupHtml(BASE)
    expect(html).not.toContain('★')
    expect(html).toContain('Place des Montres')
    expect(html).toContain('24 Place des Halles')
  })

  it('produit exactement le même HTML avec ou sans paramètres d’avis vides', () => {
    // Garde-fou : la carte des sites sans fiche Google ne doit pas bouger d'un caractère.
    expect(
      buildStoreMapPopupHtml({ ...BASE, ratingLabel: '', countLabel: '', reviewsUrl: '' }),
    ).toBe(buildStoreMapPopupHtml(BASE))
  })

  it('n’affiche pas de note sans libellé, même avec un nombre d’avis', () => {
    expect(buildStoreMapPopupHtml({ ...BASE, countLabel: '128 avis' })).toBe(
      buildStoreMapPopupHtml(BASE),
    )
  })
})

describe('buildStoreMapPopupHtml — bulle avec avis', () => {
  const WITH_RATING = {
    ...BASE,
    ratingLabel: '4,7',
    countLabel: '128 avis',
    reviewsUrl: 'https://maps.google.com/?cid=42',
    reviewsLabel: 'Voir sur Google',
  }

  it('affiche la note, le nombre d’avis et le lien vers la fiche', () => {
    const html = buildStoreMapPopupHtml(WITH_RATING)
    expect(html).toContain('★')
    expect(html).toContain('4,7')
    expect(html).toContain('128 avis')
    expect(html).toContain('href="https://maps.google.com/?cid=42"')
    expect(html).toContain('Voir sur Google')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  it('rend la note dans les deux gabarits (avec et sans logo)', () => {
    const withLogo = buildStoreMapPopupHtml({ ...WITH_RATING, logoUrl: 'https://cdn/logo.png' })
    expect(withLogo).toContain('128 avis')
    expect(withLogo).toContain('<img src="https://cdn/logo.png"')
  })

  it('échappe le libellé et l’URL', () => {
    const html = buildStoreMapPopupHtml({
      ...WITH_RATING,
      countLabel: '<script>alert(1)</script>',
      reviewsUrl: 'https://example.com/"onmouseover="alert(1)',
    })
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('&quot;onmouseover=')
  })

  it('omet le lien quand aucune URL de fiche n’est connue', () => {
    const html = buildStoreMapPopupHtml({ ...WITH_RATING, reviewsUrl: '' })
    expect(html).toContain('128 avis')
    expect(html).not.toContain('<a href')
  })
})
