/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import GoogleReviewsBlock from './GoogleReviewsBlock.vue'
import { resetGoogleReviewsState } from '@/composables/useGoogleReviews.js'

const getSiteConfigMock = vi.hoisted(() => vi.fn())
const fetchGoogleReviewsMock = vi.hoisted(() => vi.fn())

vi.mock('@/site/getSiteConfig.js', () => ({
  getSiteConfig: getSiteConfigMock,
}))

vi.mock('@/services/googleReviewsService.js', () => ({
  fetchGoogleReviews: fetchGoogleReviewsMock,
}))

function siteConfig({ enabled = true } = {}) {
  return {
    features: { googleReviews: enabled },
    googleReviews: {
      enabled,
      placeId: enabled ? 'ChIJabc' : '',
      maxReviews: 5,
      profileUrl: 'https://maps.google.com/place',
    },
    i18n: { activeLocale: 'fr' },
    locale: 'fr',
  }
}

function review(index) {
  return {
    id: `r/${index}`,
    rating: 5,
    text: `Avis numéro ${index}.`,
    publishTime: `2026-0${index}-01T10:00:00Z`,
    relativeTime: 'il y a un mois',
    authorName: `Client ${index}`,
    authorPhotoUrl: '',
    authorUri: 'https://www.google.com/maps/contrib/1',
  }
}

function payload(count) {
  return {
    rating: 4.7,
    userRatingCount: 128,
    googleMapsUri: 'https://maps.google.com/?cid=42',
    reviews: Array.from({ length: count }, (_, i) => review(i + 1)),
  }
}

beforeEach(() => {
  resetGoogleReviewsState()
  getSiteConfigMock.mockReturnValue(siteConfig())
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('GoogleReviewsBlock', () => {
  it('affiche les avis, la note et le lien vers la fiche', async () => {
    fetchGoogleReviewsMock.mockResolvedValue(payload(5))
    const wrapper = mount(GoogleReviewsBlock)
    await flushPromises()

    expect(wrapper.findAllComponents({ name: 'GoogleReviewCard' })).toHaveLength(5)
    expect(wrapper.text()).toContain('4,7')
    expect(wrapper.text()).toContain('128 avis')

    const link = wrapper.get('a[target="_blank"]')
    expect(link.attributes('href')).toBe('https://maps.google.com/?cid=42')
    expect(link.attributes('rel')).toBe('noopener noreferrer')
  })

  it('respecte le plafond maxReviews du manifest', async () => {
    getSiteConfigMock.mockReturnValue({
      ...siteConfig(),
      googleReviews: { ...siteConfig().googleReviews, maxReviews: 3 },
    })
    fetchGoogleReviewsMock.mockResolvedValue(payload(5))

    const wrapper = mount(GoogleReviewsBlock)
    await flushPromises()

    expect(wrapper.findAllComponents({ name: 'GoogleReviewCard' })).toHaveLength(3)
  })

  it('ne rend rien quand le backend est injoignable', async () => {
    fetchGoogleReviewsMock.mockResolvedValue(null)
    const wrapper = mount(GoogleReviewsBlock)
    await flushPromises()

    expect(wrapper.find('.google-reviews').exists()).toBe(false)
  })

  it('ne rend rien quand la fiche n’a aucun avis', async () => {
    fetchGoogleReviewsMock.mockResolvedValue(payload(0))
    const wrapper = mount(GoogleReviewsBlock)
    await flushPromises()

    expect(wrapper.find('.google-reviews').exists()).toBe(false)
  })

  it('n’appelle pas le backend quand la fonctionnalité est éteinte', async () => {
    getSiteConfigMock.mockReturnValue(siteConfig({ enabled: false }))
    const wrapper = mount(GoogleReviewsBlock)
    await flushPromises()

    expect(fetchGoogleReviewsMock).not.toHaveBeenCalled()
    expect(wrapper.find('.google-reviews').exists()).toBe(false)
  })

  it('ne déclenche qu’un seul appel réseau pour deux blocs montés sur la même page', async () => {
    fetchGoogleReviewsMock.mockResolvedValue(payload(5))

    const home = mount(GoogleReviewsBlock)
    const contact = mount(GoogleReviewsBlock, { props: { variant: 'compact' } })
    await flushPromises()

    expect(fetchGoogleReviewsMock).toHaveBeenCalledTimes(1)
    expect(home.findAllComponents({ name: 'GoogleReviewCard' })).toHaveLength(5)
    expect(contact.findAllComponents({ name: 'GoogleReviewCard' })).toHaveLength(5)
  })

  it('transmet la langue active au service', async () => {
    fetchGoogleReviewsMock.mockResolvedValue(payload(1))
    getSiteConfigMock.mockReturnValue({ ...siteConfig(), i18n: { activeLocale: 'de' } })

    mount(GoogleReviewsBlock)
    await flushPromises()

    expect(fetchGoogleReviewsMock).toHaveBeenCalledWith(expect.objectContaining({ locale: 'de' }))
  })
})
