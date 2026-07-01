import { describe, expect, it } from 'vitest'

import { buildNewsletterPreview } from './newsletterPreview.js'

describe('buildNewsletterPreview', () => {
  it('renders the provided body html', () => {
    const html = buildNewsletterPreview({}, '<h2>Titre</h2><p>Contenu</p>')
    expect(html).toContain('<h2>Titre</h2>')
    expect(html).toContain('Contenu')
  })

  it('shows a placeholder when the body is empty', () => {
    const html = buildNewsletterPreview({}, '')
    expect(html).toContain('Aucun contenu')
  })

  it('applies the accent color and logo text from settings', () => {
    const html = buildNewsletterPreview(
      { accentColor: '#123456', logoText: 'MA MARQUE' },
      '<p>x</p>',
    )
    expect(html).toContain('#123456')
    expect(html).toContain('MA MARQUE')
  })

  it('uses a custom header when provided', () => {
    const html = buildNewsletterPreview({ headerHtml: '<p>En-tête</p>' }, '<p>x</p>')
    expect(html).toContain('En-tête')
  })

  it('renders footer content and the sender name', () => {
    const html = buildNewsletterPreview(
      { footerHtml: '<p>Adresse</p>', senderName: 'Boutique' },
      '<p>x</p>',
    )
    expect(html).toContain('Adresse')
    expect(html).toContain('Boutique')
  })

  it('always includes an unsubscribe affordance in the preview', () => {
    const html = buildNewsletterPreview({}, '<p>x</p>')
    expect(html).toContain('Se désinscrire')
  })

  it('falls back to a default accent color', () => {
    const html = buildNewsletterPreview({}, '<p>x</p>')
    expect(html).toContain('#d4af37')
  })
})
