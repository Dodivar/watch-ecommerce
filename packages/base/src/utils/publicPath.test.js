import { describe, expect, it, vi } from 'vitest'
import { publicPath } from './publicPath.js'

describe('publicPath', () => {
  it('préfixe un chemin avec le base path Vite', () => {
    vi.stubEnv('BASE_URL', '/watch-ecommerce/')
    expect(publicPath('/home-selections/omega.jpg')).toBe(
      '/watch-ecommerce/home-selections/omega.jpg',
    )
  })

  it('retourne le base path seul si le chemin est vide', () => {
    vi.stubEnv('BASE_URL', '/watch-ecommerce/')
    expect(publicPath('')).toBe('/watch-ecommerce/')
  })

  it('utilise VITE_BASE_PATH hors contexte Vite (chargement site.config)', () => {
    vi.stubEnv('BASE_URL', undefined)
    process.env.VITE_BASE_PATH = '/watch-ecommerce/'
    expect(publicPath('home-selections/omega.jpg')).toBe(
      '/watch-ecommerce/home-selections/omega.jpg',
    )
    delete process.env.VITE_BASE_PATH
  })

  it('fonctionne à la racine du domaine', () => {
    vi.stubEnv('BASE_URL', '/')
    expect(publicPath('brand-logo.jpg')).toBe('/brand-logo.jpg')
  })
})
