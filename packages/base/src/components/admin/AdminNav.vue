<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getSiteConfig } from '@/site/getSiteConfig.js'

const route = useRoute()
const features = getSiteConfig().features

const links = computed(() => {
  const items = [
    { to: '/admin', label: 'Montres', match: (p) => p === '/admin' || p.startsWith('/admin/watches') },
    { to: '/admin/orders', label: 'Commandes', match: (p) => p.startsWith('/admin/orders') },
    { to: '/admin/leads', label: 'Messages', match: (p) => p.startsWith('/admin/leads') },
    { to: '/admin/promo', label: 'Promos', match: (p) => p.startsWith('/admin/promo') },
    { to: '/admin/home-featured', label: 'Accueil', match: (p) => p === '/admin/home-featured' },
    { to: '/admin/users', label: 'Utilisateurs', match: (p) => p === '/admin/users' },
  ]
  if (features.blog) {
    items.splice(3, 0, {
      to: '/admin/articles',
      label: 'Articles',
      match: (p) => p.startsWith('/admin/articles'),
    })
  }
  return items
})
</script>

<template>
  <nav class="w-full flex flex-nowrap gap-2 mb-6 border-b border-gray-200 pb-3">
    <RouterLink
      v-for="link in links"
      :key="link.to"
      :to="link.to"
      class="flex-1 min-w-0 text-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
      :class="
        link.match(route.path)
          ? 'bg-primary text-white'
          : 'text-gray-600 hover:bg-cream hover:text-text-main'
      "
    >
      {{ link.label }}
    </RouterLink>
  </nav>
</template>
