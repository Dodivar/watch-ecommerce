import { describe, expect, it } from 'vitest'
import { parseLegalInline } from './parseLegalInline.js'

describe('parseLegalInline', () => {
  it('laisse un texte simple intact', () => {
    expect(parseLegalInline('Bonjour')).toEqual([{ type: 'text', text: 'Bonjour' }])
  })

  it('isole le gras', () => {
    expect(parseLegalInline('un **mot** gras')).toEqual([
      { type: 'text', text: 'un ' },
      { type: 'bold', text: 'mot' },
      { type: 'text', text: ' gras' },
    ])
  })

  it('transforme une adresse e-mail en lien mailto', () => {
    expect(parseLegalInline('E-mail : a@b.fr.')).toEqual([
      { type: 'text', text: 'E-mail : ' },
      { type: 'link', text: 'a@b.fr', href: 'mailto:a@b.fr' },
      { type: 'text', text: '.' },
    ])
  })

  it('lit un lien libellé et refuse les schémas non http', () => {
    expect(parseLegalInline('[site](https://x.fr)')).toEqual([
      { type: 'link', text: 'site', href: 'https://x.fr' },
    ])
    expect(parseLegalInline('[x](javascript:alert(1))')).toEqual([
      { type: 'text', text: '[x](javascript:alert(1))' },
    ])
  })

  it('garde cliquable un e-mail en gras', () => {
    expect(parseLegalInline('**a@b.fr**')).toEqual([
      { type: 'link', text: 'a@b.fr', href: 'mailto:a@b.fr' },
    ])
  })
})
