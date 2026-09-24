// @vitest-environment happy-dom
/**
 * Filtre « Couleur du cadran » de la collection : `dial_color` est du texte libre, le filtre
 * ne voit que les couleurs reconnues comme pastilles (voir `constants/watchDialColors.js`).
 */
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/services/watchService', () => ({ getAllWatchesForListing: vi.fn() }))
vi.mock('@/services/watchPromotionCampaignService.js', () => ({
  getActiveCampaignWatchPricingPublic: vi.fn(),
}))

const { useWatchListing } = await import('./useWatchListing.js')

function makeWatch(id, dialColor) {
  return { id, brand: 'Rolex', price: 1000, details: { dialColor } }
}

function listingWith(watches) {
  const listing = useWatchListing()
  listing.watches = watches
  return listing
}

describe('useWatchListing — couleur du cadran', () => {
  const watches = [
    makeWatch('a', 'Noir'),
    makeWatch('b', 'Blanc / noir'),
    makeWatch('c', 'Bleu glacier'),
    makeWatch('d', ''),
  ]

  it('ne propose que les couleurs présentes, dans l’ordre du référentiel', () => {
    const listing = listingWith(watches)
    expect(listing.availableDialColors.map((c) => c.slug)).toEqual(['black', 'white'])
  })

  it('garde les montres dont le cadran porte au moins une couleur cochée', () => {
    const listing = listingWith(watches)
    listing.selectedDialColors = ['black']
    expect(listing.filteredWatches.map((w) => w.id).sort()).toEqual(['a', 'b'])
    expect(listing.activeFilterCount).toBe(1)
  })

  it('passe par le brouillon du tiroir comme les autres filtres', () => {
    const listing = listingWith(watches)
    listing.toggleDialColor('white')
    expect(listing.getDraftSectionCount('dialColor')).toBe(1)
    expect(listing.getDraftFilteredCount()).toBe(1)
    listing.applyDrawerFilters()
    expect(listing.selectedDialColors).toEqual(['white'])
    listing.resetAllFilters()
    expect(listing.selectedDialColors).toEqual([])
  })
})
