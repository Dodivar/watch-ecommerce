/**
 * @vitest-environment happy-dom
 *
 * Ce que le curseur de budget **enregistre**, par opposition à ce qu'il montre.
 *
 * Les deux se ressemblent à l'écran et divergent dans la durée : une préférence de budget
 * survit au catalogue sur lequel elle a été réglée (`watch_match_alerts.criteria`), alors que
 * les bornes du curseur, elles, sont recalculées à chaque visite depuis le stock du moment
 * (`buildMatchFacets`). D'où la règle testée ici : poignée haute au bout = borne **ouverte**,
 * `max: null`, et non le prix de la montre la plus chère du jour.
 */
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import MatchPreferenceStep from './MatchPreferenceStep.vue'
import { getMatchCriterion } from '@/utils/watchMatchCore.js'

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

function mountStep(modelValue = null) {
  return mount(MatchPreferenceStep, {
    props: { criterion: getMatchCriterion('budget'), facet: FACET, modelValue },
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

  it('replace une borne ouverte au maximum du curseur sans la refermer', () => {
    // Aller-retour : ce qui a été enregistré ouvert doit se réafficher au bout du curseur…
    const wrapper = mountStep({ min: 6000, max: null })
    expect(wrapper.vm.sliderRange).toEqual([6000, FACET.max])
    // …et la dernière tranche rester visiblement active.
    expect(wrapper.findAll('button').pop().attributes('aria-pressed')).toBe('true')
  })
})
