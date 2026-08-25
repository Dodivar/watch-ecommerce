/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import AdminWatchStats from './AdminWatchStats.vue'

const getSiteConfigMock = vi.hoisted(() => vi.fn())
const getArticleStatsByDayMock = vi.hoisted(() => vi.fn())

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
}))

vi.mock('@/services/admin/adminArticleService', () => ({
  getArticleStatsByDay: getArticleStatsByDayMock,
}))

const ARTICLE_CHART_TITLE = 'Évolution des articles créés et vus'

async function mountStats({ blog }) {
  getSiteConfigMock.mockReturnValue({ features: { blog } })
  const wrapper = mount(AdminWatchStats, {
    global: { stubs: { RouterLink: true } },
  })
  await flushPromises()
  return wrapper
}

describe('AdminWatchStats — statistiques blog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getArticleStatsByDayMock.mockResolvedValue([
      { date: '2026-01-01', created: 2, views: 10 },
    ])
  })

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
