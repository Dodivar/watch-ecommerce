<script setup>
import { useCart } from '@/composables/useCart.js'

defineProps({
  features: { type: Object, required: true },
  isAdmin: { type: Boolean, required: true },
  navItems: { type: Array, required: true },
  logoSrc: { type: String, required: true },
  logoAlt: { type: String, required: true },
  purchaseEnabled: { type: Boolean, default: false },
})

const open = defineModel('open', { type: Boolean, default: false })

const { badgeLabel, toggleDrawer } = useCart()

function close() {
  open.value = false
}

function openCartFromMenu() {
  toggleDrawer()
  open.value = false
}
</script>

<template>
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
      class="fixed inset-0 bg-primary z-30 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Menu principal"
    >
      <div class="absolute top-6 right-6 flex items-center gap-2">
        <button
          v-if="purchaseEnabled"
          type="button"
          class="relative p-2 text-white hover:bg-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/80"
          aria-label="Ouvrir le panier"
          @click="openCartFromMenu"
        >
          <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <span
            v-if="badgeLabel"
            class="absolute -top-0.5 -right-0.5 min-h-[1.125rem] min-w-[1.125rem] px-1 flex items-center justify-center rounded-full bg-white text-[10px] font-bold text-primary leading-none"
          >
            {{ badgeLabel }}
          </span>
        </button>
        <button
          type="button"
          @click="close"
          class="text-white focus:outline-none p-2"
          aria-label="Fermer le menu"
        >
          <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <nav
        class="flex flex-col items-center justify-center flex-1 space-y-8 text-xl font-semibold text-white w-screen px-4 overflow-y-auto py-24"
      >
        <RouterLink to="/" @click="close">
          <img width="100" :src="logoSrc" :alt="logoAlt" />
        </RouterLink>
        <template v-if="isAdmin && features.admin">
          <RouterLink
            v-if="features.collection"
            to="/collection"
            @click="close"
            class="hover:text-cream-100 transition-colors"
            >Nos montres</RouterLink
          >
          <RouterLink to="/admin" @click="close" class="hover:text-cream-100 transition-colors"
            >Tableau de bord</RouterLink
          >
          <RouterLink
            v-if="features.blog"
            to="/admin/articles"
            @click="close"
            class="hover:text-cream-100 transition-colors"
            >Articles</RouterLink
          >
        </template>
        <template v-else>
          <template v-for="(item, idx) in navItems" :key="'mnav-' + idx + '-' + item.type">
            <RouterLink
              v-if="item.type === 'link'"
              :to="item.to"
              @click="close"
              class="hover:text-cream-100 transition-colors text-center"
              >{{ item.label }}</RouterLink
            >
            <!-- N'AFFICHE PAS LES GROUPES DE LIENS, uniquement les liens simples -->
            <!-- <div
              v-else-if="item.type === 'group'"
              class="flex flex-col items-center gap-6 w-full max-w-sm"
            >
              <RouterLink
                v-if="item.to"
                :to="item.to"
                @click="close"
                class="text-base font-semibold uppercase tracking-wide text-white/75 hover:text-cream-100 transition-colors text-center"
                >{{ item.label }}</RouterLink
              >
              <span
                v-else
                class="text-base font-semibold uppercase tracking-wide text-white/75"
                >{{ item.label }}</span
              >
              <RouterLink
                v-for="(sub, j) in item.items"
                :key="'msub-' + j + '-' + sub.to"
                :to="sub.to"
                @click="close"
                class="hover:text-cream-100 transition-colors text-lg text-center"
                >{{ sub.label }}</RouterLink
              >
            </div> -->
          </template>
        </template>
      </nav>
    </div>
  </Transition>
</template>
