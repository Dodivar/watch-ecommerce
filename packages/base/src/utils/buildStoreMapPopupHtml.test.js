import { describe, expect, it, vi } from 'vitest'

vi.mock('@/config', () => ({ BASE_URL: 'https://example.com/' }))

import {
  buildStoreMapPopupHtml,
  resolveStoreMapPopupLogoUrl,
} from './buildStoreMapPopupHtml.js'

describe('resolveStoreMapPopupLogoUrl', () => {
  it('retourne null sans chemin exploitable', () => {
    expect(resolveStoreMapPopupLogoUrl('')).toBeNull()
    expect(resolveStoreMapPopupLogoUrl('   ')).toBeNull()
    expect(resolveStoreMapPopupLogoUrl(null)).toBeNull()
  })

  it('laisse intactes les URLs absolues', () => {
    expect(resolveStoreMapPopupLogoUrl('https://cdn.example.com/logo.png')).toBe(
      'https://cdn.example.com/logo.png',
    )
    expect(resolveStoreMapPopupLogoUrl('HTTP://cdn.example.com/logo.png')).toBe(
      'HTTP://cdn.example.com/logo.png',
    )
  })

  it('préfixe les chemins relatifs avec BASE_URL sans double slash', () => {
    expect(resolveStoreMapPopupLogoUrl('/logo.png')).toBe('https://example.com/logo.png')
    expect(resolveStoreMapPopupLogoUrl('logo.png')).toBe('https://example.com/logo.png')
  })
})

describe('buildStoreMapPopupHtml', () => {
  it('inclut logo, titre et adresse quand tout est fourni', () => {
    const html = buildStoreMapPopupHtml({
      title: 'Sauvage Watches',
      addressHtml: '12 Rue de la Paix<br>75002 Paris',
      logoUrl: 'https://example.com/logo.png',
      logoAlt: 'Logo boutique',
    })

    expect(html).toContain('src="https://example.com/logo.png"')
    expect(html).toContain('alt="Logo boutique"')
    expect(html).toContain('Sauvage Watches')
    expect(html).toContain('12 Rue de la Paix<br>75002 Paris')
  })

  it('rend une bulle sans image quand logoUrl est absent', () => {
    const html = buildStoreMapPopupHtml({ title: 'Boutique', addressHtml: 'Paris' })

    expect(html).not.toContain('<img')
    expect(html).toContain('Boutique')
    expect(html).toContain('Paris')
  })

  it('omet le bloc adresse quand addressHtml est vide', () => {
    const html = buildStoreMapPopupHtml({ title: 'Boutique', addressHtml: '   ' })
    expect(html).not.toContain('margin-top:4px')
  })

  it('échappe le HTML du titre et de l’alt (anti-injection)', () => {
    const html = buildStoreMapPopupHtml({
      title: '<script>alert("x")</script> & Co',
      logoUrl: 'https://example.com/a.png',
      logoAlt: '"quotes"',
    })

    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('&amp; Co')
    expect(html).toContain('alt="&quot;quotes&quot;"')
  })

  it('utilise le titre comme alt par défaut', () => {
    const html = buildStoreMapPopupHtml({
      title: 'Boutique',
      logoUrl: 'https://example.com/a.png',
    })
    expect(html).toContain('alt="Boutique"')
  })
})
