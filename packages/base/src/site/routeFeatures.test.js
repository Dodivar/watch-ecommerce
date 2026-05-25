import { describe, expect, it } from 'vitest'

import { isRouteActiveForFeatures } from './routeFeatures.js'

describe('isRouteActiveForFeatures', () => {
  const features = {
    admin: true,
    blog: false,
    collection: true,
  }

  it('active si feature principale activée', () => {
    expect(isRouteActiveForFeatures({ feature: 'admin' }, features)).toBe(true)
  })

  it('inactive si feature principale désactivée', () => {
    expect(isRouteActiveForFeatures({ feature: 'blog' }, features)).toBe(false)
  })

  it('inactive si requiresFeatures non satisfait', () => {
    expect(
      isRouteActiveForFeatures({ feature: 'admin', requiresFeatures: ['blog'] }, features),
    ).toBe(false)
  })

  it('active si toutes les requiresFeatures sont satisfaites', () => {
    expect(
      isRouteActiveForFeatures(
        { feature: 'admin', requiresFeatures: ['collection'] },
        features,
      ),
    ).toBe(true)
  })
})
