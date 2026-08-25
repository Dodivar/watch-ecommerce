/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import AdminWatchStats from './AdminWatchStats.vue'

const getSiteConfigMock = vi.hoisted(() => vi.fn())
const getArticleStatsByDayMock = vi.hoisted(() => vi.fn())
const getReturnStatsForAdminMock = vi.hoisted(() => vi.fn())
const getLeadStatsByDayMock = vi.hoisted(() => vi.fn())

vi.mock('@/site/getSiteConfig.js', () => ({
  getSiteConfig: getSiteConfigMock,
}))

vi.mock('./AdminShell.vue', () => ({
  default: { name: 'AdminShell', template: '<div><slot /></div>' },
}))

// Chart.js ne sait pas dessiner sous happy-dom : on remplace les rendus par des
// marqueurs, ce qui suffit pour vérifier la présence ou l'absence d'un graphique.
vi.mock('vue-chartjs', () => ({
  Chart: { name: 'Chart', template: '<div class="chart-stub" />' },
  Doughnut: { name: 'Doughnut', template: '<div class="chart-stub" />' },
  Bar: { name: 'Bar', template: '<div class="chart-stub" />' },
}))

vi.mock('chart.js', () => ({
  Chart: { register: vi.fn() },
  CategoryScale: {},
  LinearScale: {},
  PointElement: {},
  LineElement: {},
  BarElement: {},
  ArcElement: {},
  LineController: {},
  BarController: {},
  DoughnutController: {},
  Title: {},
  Tooltip: {},
  Legend: {},
  Filler: {},
}))

vi.mock('@/services/admin/adminWatchService', () => ({
  getWatchStatsByDay: vi.fn(() => Promise.resolve([])),
  getWatchInventoryStats: vi.fn(() => Promise.resolve(null)),
  getStorageStats: vi.fn(() => Promise.resolve(null)),
  getTableSizes: vi.fn(() => Promise.resolve([])),
}))

vi.mock('@/services/admin/adminOrderService', () => ({
  getSalesStatsByDay: vi.fn(() =>
    Promise.resolve({ daily: [], totalRevenueCents: 0, orderCount: 0, avgOrderValueCents: 0 }),
  ),
  getReturnStatsForAdmin: getReturnStatsForAdminMock,
}))

vi.mock('@/services/admin/adminLeadService', () => ({
  getLeadStatsByDay: getLeadStatsByDayMock,
}))

vi.mock('@/services/admin/adminArticleService', () => ({
  getArticleStatsByDay: getArticleStatsByDayMock,
}))

const ARTICLE_CHART_TITLE = 'Évolution des articles créés et vus'
const RETURNS_SECTION_TITLE = 'Retours & remboursements'
const LEADS_SECTION_TITLE = 'Demandes clients'

const RETURN_STATS = {
  paidOrderCount: 8,
  paidRevenueCents: 800000,
  byStatus: { none: 5, requested: 1, received: 0, refunded: 2, rejected: 0 },
  openCount: 1,
  refundedCount: 2,
  refundedAmountCents: 150000,
  overdueCount: 1,
  refundRate: 25,
  refundedRevenueShare: 18.75,
  avgRefundDelayDays: 4.25,
}

async function mountStats(features) {
  getSiteConfigMock.mockReturnValue({ features })
  const wrapper = mount(AdminWatchStats, {
    global: { stubs: { RouterLink: true } },
  })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  vi.clearAllMocks()
  getArticleStatsByDayMock.mockResolvedValue([{ date: '2026-01-01', created: 2, views: 10 }])
  getReturnStatsForAdminMock.mockResolvedValue(RETURN_STATS)
  getLeadStatsByDayMock.mockResolvedValue({ daily: [], byType: {}, total: 0 })
})

describe('AdminWatchStats — statistiques blog', () => {

  it('masque le graphique des articles quand le manifest client désactive le blog', async () => {
    const wrapper = await mountStats({ blog: false })

    expect(wrapper.text()).not.toContain(ARTICLE_CHART_TITLE)
  })

  it("n'interroge pas les statistiques d'articles quand le blog est désactivé", async () => {
    await mountStats({ blog: false })

    expect(getArticleStatsByDayMock).not.toHaveBeenCalled()
  })

  it('affiche le graphique des articles quand le blog est activé', async () => {
    const wrapper = await mountStats({ blog: true })

    expect(getArticleStatsByDayMock).toHaveBeenCalled()
    expect(wrapper.text()).toContain(ARTICLE_CHART_TITLE)
  })
})

describe('AdminWatchStats — retours & remboursements', () => {
  it('résume les dossiers retour de la période', async () => {
    const wrapper = await mountStats({ purchase: true })
    const text = wrapper.text()

    expect(text).toContain(RETURNS_SECTION_TITLE)
    // Commandes remboursées sur commandes payées, montant rendu, taux et délai.
    expect(text).toContain('Sur 8 commandes payées')
    expect(text).toContain('18.8 % du CA encaissé')
    expect(text).toContain('25.0 %')
    expect(text).toContain('4.3 j')
  })

  it('alerte sur les dossiers ouverts au-delà du délai légal', async () => {
    const wrapper = await mountStats({ purchase: true })

    expect(wrapper.text()).toContain('1 dossier hors délai légal (14 j)')
  })

  it('rappelle le délai légal quand aucun dossier ne traîne', async () => {
    getReturnStatsForAdminMock.mockResolvedValue({ ...RETURN_STATS, overdueCount: 0 })

    const wrapper = await mountStats({ purchase: true })

    expect(wrapper.text()).toContain('Délai légal : 14 jours après la demande')
  })

  it('affiche N/A tant qu’aucun remboursement n’est daté', async () => {
    getReturnStatsForAdminMock.mockResolvedValue({ ...RETURN_STATS, avgRefundDelayDays: null })

    const wrapper = await mountStats({ purchase: true })

    expect(wrapper.text()).toContain('N/A')
  })

  it('remplace le graphique par un état vide sans aucun dossier', async () => {
    getReturnStatsForAdminMock.mockResolvedValue({
      ...RETURN_STATS,
      byStatus: { none: 8, requested: 0, received: 0, refunded: 0, rejected: 0 },
      openCount: 0,
      refundedCount: 0,
      refundedAmountCents: 0,
    })

    const wrapper = await mountStats({ purchase: true })

    expect(wrapper.text()).toContain('Aucun dossier retour sur cette période')
  })

  it('masque la section et n’interroge rien sans vente en ligne', async () => {
    const wrapper = await mountStats({ purchase: false })

    expect(wrapper.text()).not.toContain(RETURNS_SECTION_TITLE)
    expect(getReturnStatsForAdminMock).not.toHaveBeenCalled()
  })
})

describe('AdminWatchStats — demandes clients', () => {
  it('trace une série par type proposé par le site', async () => {
    getLeadStatsByDayMock.mockResolvedValue({
      daily: [{ date: '2026-08-01', total: 3, byType: { contact: 1, repair: 2 } }],
      byType: { contact: 1, repair: 2, appointment: 0, estimation: 0, search: 0 },
      total: 3,
    })

    const wrapper = await mountStats({ contact: true, repairRequest: true })
    const text = wrapper.text()

    expect(text).toContain(LEADS_SECTION_TITLE)
    // Type dominant sur la période.
    expect(text).toContain('Atelier (2)')
  })

  it('garde l’historique d’un type que le site ne propose plus', async () => {
    getLeadStatsByDayMock.mockResolvedValue({
      daily: [{ date: '2026-08-01', total: 4, byType: { estimation: 4 } }],
      byType: { contact: 0, repair: 0, appointment: 0, estimation: 4, search: 0 },
      total: 4,
    })

    const wrapper = await mountStats({ estimation: false })

    expect(wrapper.text()).toContain('Estimation (4)')
  })

  it('affiche un état vide sans aucune demande', async () => {
    const wrapper = await mountStats({ contact: true })

    expect(wrapper.text()).toContain('Aucune demande sur cette période')
  })
})
