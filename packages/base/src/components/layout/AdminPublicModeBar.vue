<script setup>
import { LayoutDashboard } from '@lucide/vue'

defineProps({
  visible: { type: Boolean, default: false },
})
</script>

<template>
  <div
    v-if="visible"
    class="border-t border-primary/15 bg-primary/5"
    role="status"
    aria-live="polite"
  >
    <div
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between gap-3 text-xs sm:text-sm"
    >
      <p class="text-text-main/85 min-w-0">
        <span class="font-semibold text-primary">Mode admin</span>
        <span class="hidden sm:inline"> — vous voyez plus qu'un visiteur</span>
        <span class="sm:hidden"> — vue élargie</span>
      </p>
      <RouterLink
        to="/admin"
        class="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
      >
        <LayoutDashboard class="w-3.5 h-3.5" :stroke-width="2" aria-hidden="true" />
        <span>Tableau de bord</span>
      </RouterLink>
    </div>
  </div>
</template>
