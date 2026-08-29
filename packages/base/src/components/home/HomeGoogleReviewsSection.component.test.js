/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import HomeGoogleReviewsSection from './HomeGoogleReviewsSection.vue'
import { resetGoogleReviewsState } from '@/composables/useGoogleReviews.js'

const getSiteConfigMock = vi.hoisted(() => vi.fn())
const fetchGoogleReviewsMock = vi.hoisted(() => vi.fn())

vi.mock('@/site/getSiteConfig.js', () => ({
  getSiteConfig: getSiteConfigMock,
}))

vi.mock('@/services/googleReviewsService.js', () => ({
  fetchGoogleReviews: fetchGoogleReviewsMock,
}))

/**
 * `useGoogleReviews` est un singleton de module : un wrapper laissé monté re-rendrait au
 * `reset` du test suivant et relancerait un chargement avec le mock de l'ancien test.
 * @type {import('@vue/test-utils').VueWrapper[]}
 */
const mounted = []

function mountSection() {
  const wrapper = mount(HomeGoogleReviewsSection)
  mounted.push(wrapper)
  return wrapper
}

function payload() {
  return {
    rating: 4.8,
    userRatingCount: 42,
    googleMapsUri: 'https://maps.google.com/?cid=42',
    reviews: [
      {
        id: 'r/1',
        rating: 5,
        text: 'Excellent accueil.',
        publishTime: '2026-05-01T10:00:00Z',
        relativeTime: 'il y a un mois',
        authorName: 'Client 1',
        authorPhotoUrl: '',
        authorUri: '',
      },
    ],
  }
}

beforeEach(() => {
  resetGoogleReviewsState()
  getSiteConfigMock.mockReturnValue({
    features: { googleReviews: true },
    googleReviews: { enabled: true, placeId: 'ChIJabc', maxReviews: 5, profileUrl: '' },
    i18n: { activeLocale: 'fr' },
    locale: 'fr',
  })
})

afterEach(() => {
  while (mounted.length) mounted.pop().unmount()
  vi.clearAllMocks()
})

describe('HomeGoogleReviewsSection', () => {
  it('retire le titre quand les avis sont indisponibles', async () => {
    // `null` = 503 (clé serveur absente) / 502 / backend injoignable. Le bloc se masquait déjà
    // seul, laissant « Ce que disent nos clients » au-dessus du vide.
    fetchGoogleReviewsMock.mockResolvedValue(null)
    const wrapper = mountSection()
    await flushPromises()

    expect(wrapper.html()).not.toContain('<section')
    expect(wrapper.text()).toBe('')
  })

  it('affiche la section quand des avis reviennent', async () => {
    fetchGoogleReviewsMock.mockResolvedValue(payload())
    const wrapper = mountSection()
    await flushPromises()

    expect(wrapper.html()).toContain('<section id="avis"')
    expect(wrapper.findAllComponents({ name: 'GoogleReviewCard' })).toHaveLength(1)
  })
})
