<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  LayoutDashboard,
  Watch,
  ShoppingBag,
  MessageSquare,
  FileText,
  Tag,
  Sparkles,
  Images,
  Users,
  ChartColumn,
  LogOut,
  Globe,
  X,
} from '@lucide/vue'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { logoutAdmin, getCurrentAdmin } from '@/services/admin/adminAuthService'
import logoSidebar from '@site/assets/logos/Logos RVB (web)/Logos RVB horizontal/Logo SW vert horizontal RVB.png'

const site = getSiteConfig()

defineProps({
  open: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close'])

const route = useRoute()
const router = useRouter()
const features = site.features

const carouselLinks = computed(() => {
  const items = []
  if (features.homeCarousel) {
    items.push({
      to: '/admin/home-carousel',
      label: 'Carrousel accueil',
      icon: Images,
      match: (p) => p === '/admin/home-carousel',
    })
  }
  if (features.homeNouvelles) {
    items.push({
      to: '/admin/home-featured',
      label: 'Carrousel nouveautés',
      icon: Sparkles,
      match: (p) => p === '/admin/home-featured',
    })
  }
  return items
})

const navItems = computed(() => {
  const items = [
    { type: 'link', to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, match: (p) => p === '/admin' },
    { type: 'link', to: '/admin/watches', label: 'Montres', icon: Watch, match: (p) => p.startsWith('/admin/watches') },
    { type: 'link', to: '/admin/orders', label: 'Commandes', icon: ShoppingBag, match: (p) => p.startsWith('/admin/orders') },
    { type: 'link', to: '/admin/leads', label: 'Messages', icon: MessageSquare, match: (p) => p.startsWith('/admin/leads') },
    { type: 'link', to: '/admin/promo', label: 'Promos', icon: Tag, match: (p) => p.startsWith('/admin/promo') },
  ]
  if (features.blog) {
    items.splice(3, 0, {
      type: 'link',
      to: '/admin/articles',
      label: 'Articles',
      icon: FileText,
      match: (p) => p.startsWith('/admin/articles'),
    })
  }
  items.push(
    { type: 'link', to: '/admin/stats', label: 'Statistiques', icon: ChartColumn, match: (p) => p === '/admin/stats' },
    { type: 'link', to: '/admin/users', label: 'Utilisateurs', icon: Users, match: (p) => p === '/admin/users' },
  )
  if (carouselLinks.value.length > 0) {
    items.push({
      type: 'group',
      label: 'Carrousels',
      items: carouselLinks.value,
    })
  }
  return items
})

const currentAdmin = ref(null)

const handleLogout = async () => {
  await logoutAdmin()
  router.push('/admin/login')
}

onMounted(async () => {
  const admin = await getCurrentAdmin()
  currentAdmin.value = admin
})
</script>

<template>
  <!-- Backdrop (mobile only) -->
  <Transition
    enter-active-class="transition-opacity duration-300"
    leave-active-class="transition-opacity duration-300"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-show="open"
      class="fixed inset-0 z-30 bg-black/40 lg:hidden"
      aria-hidden="true"
      @click="emit('close')"
    />
  </Transition>

  <aside
    class="fixed inset-y-0 left-0 z-40 flex h-screen w-64 shrink-0 flex-col overflow-hidden bg-white border-r border-gray-200 transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0"
    :class="open ? 'translate-x-0' : '-translate-x-full'"
  >
    <div class="flex items-center justify-between px-5 h-16 border-b border-gray-200 shrink-0">
      <RouterLink to="/admin" class="flex items-center min-w-0" @click="emit('close')">
        <img
          :src="logoSidebar"
          :alt="site.brand.logoAlt"
          class="h-10 w-auto max-w-[calc(100%-2rem)] object-contain object-left"
        />
      </RouterLink>
      <button
        type="button"
        class="p-2 -mr-2 text-gray-500 hover:text-gray-900 rounded-lg lg:hidden"
        aria-label="Fermer le menu"
        @click="emit('close')"
      >
        <X class="w-5 h-5" :stroke-width="2" />
      </button>
    </div>

    <nav aria-label="Administration" class="flex-1 min-h-0 px-3 py-4 space-y-1">
      <template v-for="(item, index) in navItems" :key="item.type === 'link' ? item.to : `group-${index}`">
        <RouterLink
          v-if="item.type === 'link'"
          :to="item.to"
          :aria-current="item.match(route.path) ? 'page' : undefined"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          :class="
            item.match(route.path)
              ? 'bg-primary text-white'
              : 'text-gray-600 hover:bg-cream hover:text-text-main'
          "
          @click="emit('close')"
        >
          <component :is="item.icon" class="w-5 h-5 shrink-0" :stroke-width="1.75" />
          <span class="truncate">{{ item.label }}</span>
        </RouterLink>

        <div v-else class="pt-2">
          <p class="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            {{ item.label }}
          </p>
          <RouterLink
            v-for="child in item.items"
            :key="child.to"
            :to="child.to"
            :aria-current="child.match(route.path) ? 'page' : undefined"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            :class="
              child.match(route.path)
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-cream hover:text-text-main'
            "
            @click="emit('close')"
          >
            <component :is="child.icon" class="w-5 h-5 shrink-0" :stroke-width="1.75" />
            <span class="truncate">{{ child.label }}</span>
          </RouterLink>
        </div>
      </template>
    </nav>

    <div class="px-3 py-2 shrink-0">
      <RouterLink
        to="/"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-cream hover:text-text-main transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        @click="emit('close')"
      >
        <Globe class="w-5 h-5 shrink-0" :stroke-width="1.75" />
        <span>Site public</span>
      </RouterLink>
    </div>

    <div class="border-t border-gray-200 px-3 py-4 shrink-0">
      <p
        v-if="currentAdmin"
        class="px-3 pb-2 text-xs text-gray-500 truncate"
        :title="currentAdmin.email"
      >
        {{ currentAdmin.email }}
      </p>
      <button
        type="button"
        class="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-cream hover:text-text-main transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        @click="handleLogout"
      >
        <LogOut class="w-5 h-5 shrink-0" :stroke-width="1.75" />
        <span>Déconnexion</span>
      </button>
    </div>
  </aside>
</template>
