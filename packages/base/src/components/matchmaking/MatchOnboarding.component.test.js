/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { reactive } from 'vue'

import MatchOnboarding from './MatchOnboarding.vue'

/** Fac-similé réactif de `useWatchMatchmaking()`, limité à ce que l'onboarding consomme. */
function makeMm() {
  return reactive({
    activeCriteria: ['budget', 'brand', 'bracelet'],
    currentStepIndex: 0,
    facets: {
      budget: { id: 'budget', active: true, min: 1000, max: 9000, suggestions: [] },
      brand: {
        id: 'brand',
        active: true,
        options: [
          { value: 'rolex', label: 'Rolex' },
          { value: 'omega', label: 'Omega' },
        ],
      },
      bracelet: {
        id: 'bracelet',
        active: true,
        options: [
          { value: 'steel', label: 'Acier' },
          { value: 'leather', label: 'Cuir' },
        ],
      },
    },
    session: { preferences: { budget: null, brand: [], bracelet: [] } },
    totalInBudget: 3,
    setPreference: vi.fn(),
    clearPreference: vi.fn(),
    nextStep: vi.fn(),
    previousStep: vi.fn(),
  })
}

/** « Continuer » (ou « Voir les montres ») : le dernier bouton de la barre d'action. */
function nextButton(wrapper) {
  const buttons = wrapper.findAll('.matchmaking-actions button')
  return buttons[buttons.length - 1]
}

describe('MatchOnboarding', () => {
  let scrollTo

  beforeEach(() => {
    scrollTo = vi.fn()
    window.scrollTo = scrollTo
    window.scrollY = 0
  })

  afterEach(() => {
    window.scrollY = 0
    vi.restoreAllMocks()
  })

  /**
   * L'aperçu du pool et « Continuer » vivent dans la même barre : c'est elle qui est ancrée
   * en bas de l'écran sur téléphone (cf. la feuille de style du composant).
   */
  it('groupe l’aperçu du pool et les commandes dans la barre d’action', () => {
    const wrapper = mount(MatchOnboarding, { props: { mm: makeMm() } })

    const actions = wrapper.get('.matchmaking-actions')
    expect(actions.text()).toContain('3')
    // Passer + Continuer au premier écran, Retour n'apparaît qu'ensuite.
    expect(actions.findAll('button')).toHaveLength(2)

    wrapper.unmount()
  })

  it('mesure la hauteur disponible pour que la barre tienne le bas de l’écran', () => {
    const wrapper = mount(MatchOnboarding, { props: { mm: makeMm() }, attachTo: document.body })

    const fill = wrapper.get('.matchmaking-onboarding').element.style.getPropertyValue('--mm-fill')
    expect(fill).toMatch(/^\d+px$/)

    wrapper.unmount()
  })

  it('désactive « Continuer » quand aucune montre ne tient dans le budget', () => {
    const mm = makeMm()
    mm.totalInBudget = 0
    const wrapper = mount(MatchOnboarding, { props: { mm } })

    expect(nextButton(wrapper).attributes('disabled')).toBeDefined()

    wrapper.unmount()
  })

  it('ramène la question en haut de l’écran quand on l’avait défilée', async () => {
    const mm = makeMm()
    const wrapper = mount(MatchOnboarding, { props: { mm }, attachTo: document.body })

    // L'écran est descendu de 300 px, la question est passée 200 px au-dessus du viewport :
    // son haut est donc à 100 px dans le document, soit une cible de 88 px (marge de 12).
    const region = wrapper.get('.matchmaking-step-region').element
    region.getBoundingClientRect = () => ({ top: -200 })
    window.scrollY = 300

    await nextButton(wrapper).trigger('click')

    expect(mm.nextStep).toHaveBeenCalled()
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 88 }))

    wrapper.unmount()
  })

  it('ne défile pas quand la question est déjà en haut de l’écran', async () => {
    const mm = makeMm()
    const wrapper = mount(MatchOnboarding, { props: { mm }, attachTo: document.body })

    const region = wrapper.get('.matchmaking-step-region').element
    region.getBoundingClientRect = () => ({ top: 120 })
    window.scrollY = 0

    await nextButton(wrapper).trigger('click')

    expect(scrollTo).not.toHaveBeenCalled()

    wrapper.unmount()
  })
})
