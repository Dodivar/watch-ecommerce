/** Manifests synthétiques pour tests composants (pas les vrais clients). */

export const retailMinimal = {
  siteId: 'test-retail',
  features: {
    collection: true,
    purchase: false,
  },
  watchCatalog: {
    mode: 'retail',
  },
  home: {
    sections: ['hero', 'trust'],
  },
  seo: {
    home: {
      title: 'Test',
      metaDescription: 'Test',
      ogTitle: 'Test',
      ogDescription: 'Test',
    },
  },
}

export const resaleWithPurchase = {
  siteId: 'test-resale',
  features: {
    collection: true,
    purchase: true,
  },
  watchCatalog: {
    mode: 'resale',
  },
  checkout: {
    shipping: { methods: [{ id: 'h', type: 'home', label: 'Home' }] },
  },
  seo: {
    home: {
      title: 'Resale',
      metaDescription: 'Resale',
      ogTitle: 'Resale',
      ogDescription: 'Resale',
    },
  },
}

export const noCollection = {
  siteId: 'test-no-collection',
  features: {
    collection: false,
    recherche: true,
    estimation: true,
    faq: true,
  },
  faq: { enabled: true, items: [{ q: 'Q', a: 'A' }] },
  home: {
    sections: ['hero', 'faq', 'services'],
  },
  seo: {
    home: {
      title: 'No collection',
      metaDescription: 'No collection',
      ogTitle: 'No collection',
      ogDescription: 'No collection',
    },
  },
}
