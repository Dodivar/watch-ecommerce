// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest'

// `@/config` charge le manifest complet du site : le service n'en tire que trois constantes,
// toutes passées explicitement dans ces tests.
vi.mock('@/config.js', () => ({
  VERCEL_TOOLBAR_OWNER_ID: '',
  VERCEL_TOOLBAR_PROJECT_ID: '',
  VERCEL_TOOLBAR_BRANCH: '',
}))

import { REVIEW_MODE_STORAGE_KEY, ensureReviewToolbar, resolveReviewMode } from './vercelToolbar.js'

const SCRIPT_SELECTOR = 'script[src="https://vercel.live/_next-live/feedback/feedback.js"]'

const PROJECT = { ownerId: 'team_test', projectId: 'prj_test' }

// Nœud détaché : happy-dom tenterait de télécharger un script rattaché au document.
let container

function injectedScript() {
  return container.querySelector(SCRIPT_SELECTOR)
}

beforeEach(() => {
  localStorage.clear()
  container = document.createElement('div')
})

describe('resolveReviewMode', () => {
  it('sans paramètre ni choix mémorisé : mode inactif', () => {
    expect(resolveReviewMode({ search: '', storage: localStorage })).toBe(false)
  })

  it('`?relecture=1` active le mode et le mémorise', () => {
    expect(resolveReviewMode({ search: '?relecture=1', storage: localStorage })).toBe(true)
    expect(localStorage.getItem(REVIEW_MODE_STORAGE_KEY)).toBe('1')
    // Le mode survit à une navigation sans paramètre.
    expect(resolveReviewMode({ search: '?page=2', storage: localStorage })).toBe(true)
  })

  it('`?relecture=0` coupe le mode et efface le choix mémorisé', () => {
    localStorage.setItem(REVIEW_MODE_STORAGE_KEY, '1')
    expect(resolveReviewMode({ search: '?relecture=0', storage: localStorage })).toBe(false)
    expect(localStorage.getItem(REVIEW_MODE_STORAGE_KEY)).toBeNull()
  })

  it('une valeur non reconnue laisse le choix mémorisé intact', () => {
    localStorage.setItem(REVIEW_MODE_STORAGE_KEY, '1')
    expect(resolveReviewMode({ search: '?relecture=peut-etre', storage: localStorage })).toBe(true)
    expect(localStorage.getItem(REVIEW_MODE_STORAGE_KEY)).toBe('1')
  })

  it('sans stockage disponible, le paramètre vaut pour la page en cours', () => {
    expect(resolveReviewMode({ search: '?relecture=1', storage: null })).toBe(true)
    expect(resolveReviewMode({ search: '', storage: null })).toBe(false)
  })
})

describe('ensureReviewToolbar', () => {
  it("n'injecte rien hors mode relecture", () => {
    expect(ensureReviewToolbar({ ...PROJECT, search: '', storage: localStorage, container })).toBe(
      false,
    )
    expect(injectedScript()).toBeNull()
  })

  it("n'injecte rien tant que le projet Vercel n'est pas identifié", () => {
    const params = { search: '?relecture=1', storage: localStorage, container }
    expect(ensureReviewToolbar({ ...params, ownerId: '', projectId: 'prj_test' })).toBe(false)
    expect(ensureReviewToolbar({ ...params, ownerId: 'team_test', projectId: '' })).toBe(false)
    expect(injectedScript()).toBeNull()
  })

  it('injecte le script avec les identifiants du projet et l’opt-in explicite', () => {
    expect(
      ensureReviewToolbar({ ...PROJECT, search: '?relecture=1', storage: localStorage, container }),
    ).toBe(true)

    const script = injectedScript()
    expect(script).not.toBeNull()
    expect(script.getAttribute('data-explicit-opt-in')).toBe('true')
    expect(script.getAttribute('data-owner-id')).toBe('team_test')
    expect(script.getAttribute('data-project-id')).toBe('prj_test')
    // Branche non fournie : pas d'attribut plutôt qu'une valeur devinée.
    expect(script.hasAttribute('data-branch')).toBe(false)
  })

  it('range les commentaires sous la branche demandée', () => {
    ensureReviewToolbar({
      ...PROJECT,
      branch: 'main',
      search: '?relecture=1',
      storage: localStorage,
      container,
    })
    expect(injectedScript().getAttribute('data-branch')).toBe('main')
  })

  it('reste idempotent : un seul script même sur appels répétés', () => {
    const params = { ...PROJECT, search: '?relecture=1', storage: localStorage, container }
    expect(ensureReviewToolbar(params)).toBe(true)
    expect(ensureReviewToolbar(params)).toBe(false)
    expect(container.querySelectorAll(SCRIPT_SELECTOR)).toHaveLength(1)
  })

  it('vise le <head> du document par défaut', () => {
    // On intercepte l'insertion plutôt que de rattacher le script : happy-dom tenterait
    // sinon de le télécharger.
    const appendChild = vi.spyOn(document.head, 'appendChild').mockImplementation((node) => node)

    expect(ensureReviewToolbar({ ...PROJECT, search: '?relecture=1', storage: localStorage })).toBe(
      true,
    )
    expect(appendChild).toHaveBeenCalledTimes(1)
    expect(appendChild.mock.calls[0][0].getAttribute('data-project-id')).toBe('prj_test')

    appendChild.mockRestore()
  })
})
