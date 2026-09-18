/**
 * @vitest-environment happy-dom
 *
 * Carte du point de retrait au checkout. Deux vitrines s'y rencontrent : celles qui
 * reçoivent en boutique et annoncent une adresse, et celles qui remettent la montre en
 * main propre en un lieu convenu avec l'acheteur. Ce test verrouille le fait qu'une
 * carte `whatsapp` n'affiche jamais d'adresse — c'est tout l'intérêt du drapeau.
 */
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import PickupLocationCard from './PickupLocationCard.vue'

describe('PickupLocationCard', () => {
  it('affiche l’adresse du point de retrait', () => {
    const wrapper = mount(PickupLocationCard, {
      props: {
        name: "Jack'N'Ed",
        address: '14 Place de la Cathédrale, 67000 Strasbourg',
      },
    })

    expect(wrapper.text()).toContain('14 Place de la Cathédrale, 67000 Strasbourg')
  })

  it('remplace l’adresse par la prise de rendez-vous WhatsApp', () => {
    const wrapper = mount(PickupLocationCard, {
      props: {
        name: 'Sauvage Watches',
        whatsapp: true,
      },
    })

    const text = wrapper.text()
    expect(text).toContain('Sauvage Watches')
    expect(text).toContain('WhatsApp')
    expect(text).not.toContain('Strasbourg')
  })

  it('ignore une adresse résiduelle quand le rendez-vous passe par WhatsApp', () => {
    const wrapper = mount(PickupLocationCard, {
      props: {
        name: 'Sauvage Watches',
        address: '32 Allée de la Robertsau, 67000 Strasbourg',
        whatsapp: true,
      },
    })

    expect(wrapper.text()).not.toContain('Robertsau')
  })
})
