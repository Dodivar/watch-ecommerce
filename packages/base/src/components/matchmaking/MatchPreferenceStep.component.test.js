/**
 * @vitest-environment happy-dom
 *
 * Ce que le curseur de budget **enregistre**, par opposition à ce qu'il montre.
 *
 * Les deux se ressemblent à l'écran et divergent dans la durée : une préférence de budget
 * survit au catalogue sur lequel elle a été réglée (`watch_match_alerts.criteria`), alors que
 * les bornes du curseur, elles, sont recalculées à chaque visite depuis le stock du moment
 * (`buildMatchFacets`). D'où la règle testée ici : poignée haute au bout = borne **ouverte**,
 * `max: null`, et non le prix de la montre la plus chère du jour ; poignée basse au départ =
 * plancher `0`, et non le prix de la moins chère.
 */
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import MatchPreferenceStep from './MatchPreferenceStep.vue'
import { getMatchCriterion } from '@/utils/watchMatchCore.js'
import { buildAlertPreferenceFacets } from '@/utils/watchMatchmaking.js'

const FACET = {
  id: 'budget',
  active: true,
  min: 1000,
  max: 9000,
  suggestions: [
    { min: 1000, max: 3000 },
    { min: 3000, max: 6000 },
    { min: 6000, max: 9000 },
  ],
}

function mountStep(modelValue = null, facet = FACET) {
  return mount(MatchPreferenceStep, {
    props: { criterion: getMatchCriterion('budget'), facet, modelValue },
    global: { stubs: { Slider: true } },
  })
}

/** Dernière valeur émise par `update:modelValue`. */
function lastEmitted(wrapper) {
  const events = wrapper.emitted('update:modelValue')
  return events ? events[events.length - 1][0] : undefined
}

describe('MatchPreferenceStep — budget', () => {
  it('ouvre la borne haute quand la poignée est au maximum', () => {
    const wrapper = mountStep()
    wrapper.vm.sliderRange = [4000, FACET.max]
    expect(lastEmitted(wrapper)).toEqual({ min: 4000, max: null })
  })

  it('garde un plafond chiffré quand la poignée ne va pas au bout', () => {
    const wrapper = mountStep()
    wrapper.vm.sliderRange = [4000, 6000]
    expect(lastEmitted(wrapper)).toEqual({ min: 4000, max: 6000 })
  })

  it('ouvre la borne basse (plancher 0) quand la poignée est au minimum', () => {
    const wrapper = mountStep()
    wrapper.vm.sliderRange = [FACET.min, 6000]
    expect(lastEmitted(wrapper)).toEqual({ min: 0, max: 6000 })
  })

  it('tient la promesse de la tranche « jusqu’à » : elle ne se referme pas en bas', async () => {
    const wrapper = mountStep()
    await wrapper.findAll('button')[0].trigger('click')
    expect(lastEmitted(wrapper)).toEqual({ min: 0, max: 3000 })
  })

  it('replace un plancher à 0 au minimum du curseur, tranche comprise', () => {
    const wrapper = mountStep({ min: 0, max: 3000 })
    expect(wrapper.vm.sliderRange).toEqual([FACET.min, 3000])
    expect(wrapper.findAll('button')[0].attributes('aria-pressed')).toBe('true')
  })

  it("n'enregistre rien quand les deux poignées couvrent tout le pool", () => {
    const wrapper = mountStep()
    wrapper.vm.sliderRange = [FACET.min, FACET.max]
    expect(lastEmitted(wrapper)).toBeNull()
  })

  it('tient la promesse de la tranche « à partir de » : elle ne se referme pas en haut', async () => {
    const wrapper = mountStep()
    const chips = wrapper.findAll('button')
    await chips[chips.length - 1].trigger('click')
    expect(lastEmitted(wrapper)).toEqual({ min: 6000, max: null })
  })

  it('page « mes préférences » : effleurer le budget enregistré ne le réécrit pas', async () => {
    // Le stock a bougé depuis l'inscription : il va de 3 450 à 19 000 €, le budget enregistré
    // de 3 000 à 20 000 €. Le curseur s'élargit à ce budget ; ses bornes ne doivent pas
    // tomber pile dessus, sinon « poignée en butée » se lirait « pas de borne ».
    const saved = { min: 3000, max: 20000 }
    const facet = buildAlertPreferenceFacets([{ price: 3450 }, { price: 19000 }], {
      budget: saved,
    }).budget
    const wrapper = mountStep(saved, facet)
    expect(wrapper.vm.sliderRange).toEqual([3000, 20000])
    // Un clic dans « Minimum » puis ailleurs, sans rien changer.
    await wrapper.findAll('input[type="number"]')[0].trigger('blur')
    // Rien d'émis, ou exactement le budget enregistré — surtout pas `null` ni un plancher à 0.
    const emitted = wrapper.emitted('update:modelValue')
    if (emitted) expect(lastEmitted(wrapper)).toEqual(saved)
  })

  it('page « mes préférences » : un budget ouvert reste ouvert, un plancher à 0 reste à 0', async () => {
    const saved = { min: 0, max: null }
    const facet = buildAlertPreferenceFacets([{ price: 3450 }, { price: 19000 }], {
      budget: saved,
    }).budget
    const wrapper = mountStep(saved, facet)
    await wrapper.findAll('input[type="number"]')[1].trigger('blur')
    // Les deux poignées en butée : « pas de préférence », ce qu'était déjà { 0, ouvert }.
    expect(lastEmitted(wrapper)).toBeNull()
  })

  it('replace une borne ouverte au maximum du curseur sans la refermer', () => {
    // Aller-retour : ce qui a été enregistré ouvert doit se réafficher au bout du curseur…
    const wrapper = mountStep({ min: 6000, max: null })
    expect(wrapper.vm.sliderRange).toEqual([6000, FACET.max])
    // …et la dernière tranche rester visiblement active.
    expect(wrapper.findAll('button').pop().attributes('aria-pressed')).toBe('true')
  })
})
