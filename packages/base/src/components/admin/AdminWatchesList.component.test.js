/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { computed, ref } from 'vue'

import AdminWatchesList from './AdminWatchesList.vue'

const listWatchesForAdminMock = vi.hoisted(() => vi.fn())
const getAdminWatchStatusCountsMock = vi.hoisted(() => vi.fn())
const getAdminWatchBrandsMock = vi.hoisted(() => vi.fn())
const reorderWatchesMock = vi.hoisted(() => vi.fn())
const moveWatchToCatalogEdgeMock = vi.hoisted(() => vi.fn())

vi.mock('./AdminShell.vue', () => ({
  default: { name: 'AdminShell', template: '<div><slot /></div>' },
}))

vi.mock('@/services/admin/adminWatchService', () => ({
  listWatchesForAdmin: listWatchesForAdminMock,
  getAdminWatchStatusCounts: getAdminWatchStatusCountsMock,
  getAdminWatchBrands: getAdminWatchBrandsMock,
  reorderWatches: reorderWatchesMock,
  moveWatchToCatalogEdge: moveWatchToCatalogEdgeMock,
  deleteWatch: vi.fn(),
  toggleWatchAvailability: vi.fn(),
  markWatchAsSold: vi.fn(),
}))

vi.mock('@/services/admin/useAdminPermissions', () => ({
  useAdminPermissions: () => ({
    role: ref('admin'),
    ready: ref(true),
    canWrite: computed(() => true),
    canManageUsers: computed(() => true),
    canAccessPath: () => true,
    deniedTooltip: () => '',
  }),
}))

vi.mock('@/site/getSiteConfig.js', () => ({
  getSiteConfig: () => ({ watchCatalog: { mode: 'resale' } }),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const PAGE_SIZE = 25
const TOTAL = 3000

/** Catalogue simulé : 3 000 références, display_order décroissant. */
function watchAt(globalIndex) {
  return {
    id: `watch-${globalIndex}`,
    ad_code: `AD-${globalIndex}`,
    name: `Montre ${globalIndex}`,
    brand: 'ROLEX',
    model: 'Datejust',
    reference: `16014-${globalIndex}`,
    price: 5000,
    created_at: '2026-01-01T00:00:00.000Z',
    display_order: TOTAL - globalIndex,
    is_available: true,
    is_sold: false,
    stock_quantity: 1,
    images: [],
  }
}

function pageOf({ page = 1, pageSize = PAGE_SIZE } = {}) {
  const offset = (page - 1) * pageSize
  const watches = Array.from({ length: Math.min(pageSize, TOTAL - offset) }, (_, i) =>
    watchAt(offset + i),
  )
  return { watches, total: TOTAL, page, pageSize }
}

async function mountList() {
  const wrapper = mount(AdminWatchesList)
  await flushPromises()
  return wrapper
}

/** Simule un glisser-déposer de la ligne `from` sur la ligne `to` du tableau affiché. */
async function dragRow(wrapper, from, to) {
  const rows = wrapper.findAll('tbody tr')
  const dataTransfer = { effectAllowed: '', dropEffect: '', setData: vi.fn() }
  await rows[from].trigger('dragstart', { dataTransfer })
  await rows[to].trigger('dragover', { dataTransfer })
  await rows[to].trigger('drop', { dataTransfer })
  await flushPromises()
}

beforeEach(() => {
  vi.clearAllMocks()
  listWatchesForAdminMock.mockImplementation(async (options) => pageOf(options))
  getAdminWatchStatusCountsMock.mockResolvedValue({
    available: TOTAL,
    unavailable: 4,
    sold: 12,
    all: TOTAL + 16,
  })
  getAdminWatchBrandsMock.mockResolvedValue(['ROLEX', 'OMEGA'])
  reorderWatchesMock.mockResolvedValue({ success: true })
  moveWatchToCatalogEdgeMock.mockResolvedValue({ success: true, displayOrder: 3001 })
})

describe('AdminWatchesList — pagination serveur', () => {
  it('ne demande que la page affichée, jamais le catalogue entier', async () => {
    const wrapper = await mountList()

    expect(listWatchesForAdminMock).toHaveBeenCalledTimes(1)
    expect(listWatchesForAdminMock.mock.calls[0][0]).toMatchObject({
      status: 'available',
      page: 1,
      pageSize: PAGE_SIZE,
    })
    expect(wrapper.findAll('tbody tr')).toHaveLength(PAGE_SIZE)
    expect(wrapper.text()).toContain(`1-${PAGE_SIZE} sur ${TOTAL} montres`)
  })

  it('affiche les compteurs d’onglets renvoyés par la base, pas ceux de la page', async () => {
    const wrapper = await mountList()

    // Comptés sur la page, « en stock » afficherait 25 et « vendues » 0.
    expect(wrapper.text()).toContain(String(TOTAL))
    expect(wrapper.text()).toContain('12')
    expect(wrapper.text()).toContain(String(TOTAL + 16))
  })

  it('recharge depuis le serveur au changement de page', async () => {
    const wrapper = await mountList()
    listWatchesForAdminMock.mockClear()

    const next = wrapper.findAll('button').find((b) => b.text() === 'Suivant')
    await next.trigger('click')
    await flushPromises()

    expect(listWatchesForAdminMock).toHaveBeenCalledTimes(1)
    expect(listWatchesForAdminMock.mock.calls[0][0]).toMatchObject({ page: 2, pageSize: PAGE_SIZE })
    expect(wrapper.text()).toContain(`26-50 sur ${TOTAL} montres`)
  })

  it('renvoie la recherche et le filtre marque au serveur, pas au tableau chargé', async () => {
    const wrapper = await mountList()
    listWatchesForAdminMock.mockClear()

    await wrapper.find('input[type="text"]').setValue('daytona')
    await vi.waitFor(() => expect(listWatchesForAdminMock).toHaveBeenCalled())

    expect(listWatchesForAdminMock.mock.calls.at(-1)[0]).toMatchObject({
      search: 'daytona',
      page: 1,
    })
  })
})

describe('AdminWatchesList — réordonnancement', () => {
  it('permute les positions de la page et ne touche rien au-delà', async () => {
    const wrapper = await mountList()

    // Page 2 : les positions vont de 2975 à 2951.
    const next = wrapper.findAll('button').find((b) => b.text() === 'Suivant')
    await next.trigger('click')
    await flushPromises()

    await dragRow(wrapper, 4, 0)

    expect(reorderWatchesMock).toHaveBeenCalledTimes(1)
    const updates = reorderWatchesMock.mock.calls[0][0]

    // Au plus une page de lignes touchée, quelle que soit la taille du catalogue.
    expect(updates.length).toBeLessThanOrEqual(PAGE_SIZE)

    // Les positions distribuées sont exactement celles que la page détenait déjà :
    // aucune ligne hors page ne change de rang.
    const pageOrders = pageOf({ page: 2 }).watches.map((w) => w.display_order)
    for (const update of updates) {
      expect(pageOrders).toContain(update.display_order)
    }

    // La montre déplacée prend la position de la ligne sur laquelle elle a été lâchée.
    expect(updates).toContainEqual({ id: 'watch-29', display_order: pageOrders[0] })
  })

  it('envoie « placer en tête » à la base plutôt que de renuméroter le catalogue', async () => {
    const wrapper = await mountList()

    const next = wrapper.findAll('button').find((b) => b.text() === 'Suivant')
    await next.trigger('click')
    await flushPromises()

    const toTop = wrapper.find('button[title="Placer en tête du catalogue"]')
    await toTop.trigger('click')
    await flushPromises()

    expect(moveWatchToCatalogEdgeMock).toHaveBeenCalledWith('watch-25', 'top')
    expect(reorderWatchesMock).not.toHaveBeenCalled()
  })

  it('désactive le reclassement quand le tableau est trié par une autre colonne', async () => {
    const wrapper = await mountList()

    const priceHeader = wrapper.findAll('th').find((th) => th.text().includes('Prix'))
    await priceHeader.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('le glisser-déposer et les flèches sont')
    expect(wrapper.find('tbody tr').attributes('draggable')).toBe('false')

    await dragRow(wrapper, 4, 0)
    expect(reorderWatchesMock).not.toHaveBeenCalled()
  })
})
