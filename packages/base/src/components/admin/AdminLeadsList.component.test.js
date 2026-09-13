/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { computed, ref } from 'vue'

import AdminLeadsList from './AdminLeadsList.vue'

const getLeadsForAdminMock = vi.hoisted(() => vi.fn())
const getAppointmentsByDateMock = vi.hoisted(() => vi.fn())
const getUnreadLeadsCountByTypeMock = vi.hoisted(() => vi.fn())
const updateLeadStatusMock = vi.hoisted(() => vi.fn())
const canWriteMock = vi.hoisted(() => ({ value: true }))

vi.mock('./AdminShell.vue', () => ({
  default: {
    name: 'AdminShell',
    props: ['title', 'subtitle'],
    template: '<div><p data-test="subtitle">{{ subtitle }}</p><slot /></div>',
  },
}))

vi.mock('@/services/admin/adminLeadService', () => ({
  getLeadsForAdmin: getLeadsForAdminMock,
  getAppointmentsByDate: getAppointmentsByDateMock,
  getUnreadLeadsCountByType: getUnreadLeadsCountByTypeMock,
  updateLeadStatus: updateLeadStatusMock,
  LEAD_TYPES: ['contact', 'appointment', 'estimation', 'search', 'repair'],
}))

vi.mock('@/services/admin/useAdminPermissions', () => ({
  useAdminPermissions: () => ({
    role: ref('admin'),
    ready: ref(true),
    canWrite: computed(() => canWriteMock.value),
    canManageUsers: computed(() => true),
    canAccessPath: () => true,
    deniedTooltip: () => '',
  }),
}))

vi.mock('@/site/getSiteConfig.js', () => ({
  getSiteConfig: () => ({
    watchCatalog: { mode: 'retail', appointmentEnabled: true },
    features: { contact: true, collection: true, estimation: true, recherche: true },
  }),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const RouterLinkStub = {
  name: 'RouterLink',
  props: ['to'],
  template: '<a :href="to"><slot /></a>',
}

/** Aujourd'hui / hier calculés à l'exécution : le regroupement est relatif. */
function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

const LEADS = [
  {
    id: 'lead-contact',
    type: 'contact',
    status: 'new',
    customerName: 'Jérôme Dupont',
    customerEmail: 'jerome@example.com',
    payload: { message: 'Bonjour, êtes-vous ouverts samedi ?' },
    createdAt: hoursAgo(1),
  },
  {
    id: 'lead-estimation',
    type: 'estimation',
    status: 'new',
    customerName: 'Alice Martin',
    customerEmail: 'alice@example.com',
    payload: { brand: 'Rolex', model: 'Submariner' },
    createdAt: hoursAgo(3),
  },
  {
    id: 'lead-search',
    type: 'search',
    status: 'new',
    customerName: 'Bob Leroy',
    customerEmail: 'bob@example.com',
    payload: { brand: 'Omega', model: 'Speedmaster' },
    createdAt: hoursAgo(30),
  },
]

async function mountList() {
  const wrapper = mount(AdminLeadsList, {
    global: { components: { RouterLink: RouterLinkStub } },
  })
  await flushPromises()
  return wrapper
}

function rowNames(wrapper) {
  return wrapper.findAll('li a[href^="/admin/leads/"]').map((el) => el.text())
}

function typeTab(wrapper, label) {
  return wrapper.findAll('button').find((button) => button.text().startsWith(label))
}

beforeEach(() => {
  canWriteMock.value = true
  getLeadsForAdminMock.mockReset().mockResolvedValue({ leads: LEADS, total: LEADS.length })
  getUnreadLeadsCountByTypeMock
    .mockReset()
    .mockResolvedValue({ contact: 1, appointment: 0, estimation: 1, search: 1, repair: 0 })
  getAppointmentsByDateMock.mockReset().mockResolvedValue({})
  updateLeadStatusMock.mockReset().mockResolvedValue({ success: true })
})

describe('AdminLeadsList', () => {
  it('affiche une pile unique triée par jour, tous types confondus', async () => {
    const wrapper = await mountList()

    expect(getLeadsForAdminMock).toHaveBeenCalledWith({ status: 'new', limit: 1000 })
    expect(rowNames(wrapper)).toEqual(['Jérôme Dupont', 'Alice Martin', 'Bob Leroy'])

    const dayHeadings = wrapper.findAll('section h2').map((el) => el.text())
    expect(dayHeadings[0]).toBe("Aujourd'hui")
    expect(dayHeadings).toHaveLength(2)
  })

  it('annonce le nombre de messages non lus', async () => {
    const wrapper = await mountList()
    expect(wrapper.get('[data-test="subtitle"]').text()).toBe('3 messages non lus')
  })

  it('filtre sur un type sans rappeler le serveur', async () => {
    const wrapper = await mountList()

    await typeTab(wrapper, 'Estimation').trigger('click')

    expect(rowNames(wrapper)).toEqual(['Alice Martin'])
    expect(getLeadsForAdminMock).toHaveBeenCalledTimes(1)
  })

  it('recherche sur le nom comme sur le contenu du formulaire, sans accents', async () => {
    const wrapper = await mountList()

    await wrapper.get('input[type="search"]').setValue('jerome')
    expect(rowNames(wrapper)).toEqual(['Jérôme Dupont'])

    await wrapper.get('input[type="search"]').setValue('speedmaster')
    expect(rowNames(wrapper)).toEqual(['Bob Leroy'])
  })

  it('recharge la liste au changement de statut filtré', async () => {
    const wrapper = await mountList()

    const archivedTab = wrapper.findAll('button').find((b) => b.text() === 'Archivés')
    await archivedTab.trigger('click')
    await flushPromises()

    expect(getLeadsForAdminMock).toHaveBeenLastCalledWith({ status: 'archived', limit: 1000 })
  })

  it('marque un message comme lu depuis la liste et le retire de la pile', async () => {
    const wrapper = await mountList()

    await wrapper.get('button[title="Marquer comme lu"]').trigger('click')
    await flushPromises()

    expect(updateLeadStatusMock).toHaveBeenCalledWith('lead-contact', 'read')
    expect(rowNames(wrapper)).toEqual(['Alice Martin', 'Bob Leroy'])
    expect(wrapper.get('[data-test="subtitle"]').text()).toBe('2 messages non lus')
  })

  it('archive depuis la liste', async () => {
    const wrapper = await mountList()

    await wrapper.findAll('button[title="Archiver"]')[1].trigger('click')
    await flushPromises()

    expect(updateLeadStatusMock).toHaveBeenCalledWith('lead-estimation', 'archived')
    expect(rowNames(wrapper)).toEqual(['Jérôme Dupont', 'Bob Leroy'])
  })

  it('cache les actions d’écriture pour un compte lecture seule', async () => {
    canWriteMock.value = false
    const wrapper = await mountList()

    expect(wrapper.find('button[title="Marquer comme lu"]').exists()).toBe(false)
    expect(wrapper.find('button[title="Archiver"]').exists()).toBe(false)
    expect(wrapper.find('a[href^="mailto:"]').exists()).toBe(true)
  })

  it('propose une remise à zéro quand un filtre ne renvoie rien', async () => {
    const wrapper = await mountList()

    await wrapper.get('input[type="search"]').setValue('patek')
    expect(wrapper.text()).toContain('Aucun message ne correspond à ces filtres.')

    const resetButton = wrapper.findAll('button').find((b) => b.text().includes('Réinitialiser'))
    await resetButton.trigger('click')
    expect(rowNames(wrapper)).toHaveLength(3)
  })

  it('range les rendez-vous par date dans la vue agenda', async () => {
    const today = new Date()
    const dayKey = (offsetDays) => {
      const d = new Date(today)
      d.setDate(d.getDate() + offsetDays)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }
    getAppointmentsByDateMock.mockResolvedValue({
      [dayKey(2)]: [
        { id: 'rdv-1', customerName: 'Chloé', status: 'new', payload: { time_slot: 'morning' } },
      ],
      [dayKey(-5)]: [
        { id: 'rdv-0', customerName: 'Marc', status: 'read', payload: { time_slot: 'afternoon' } },
      ],
    })

    const wrapper = await mountList()
    const agendaTab = wrapper.findAll('button').find((b) => b.text() === 'Agenda RDV')
    await agendaTab.trigger('click')

    const sections = wrapper.findAll('section h2').map((el) => el.text())
    expect(sections).toEqual(['À venir', 'Passés'])
    expect(wrapper.text()).toContain('Chloé')
    expect(wrapper.find('details').text()).toContain('Marc')
    // Les filtres de la pile ne s'appliquent pas à l'agenda : ils disparaissent.
    expect(wrapper.find('input[type="search"]').exists()).toBe(false)
  })
})
