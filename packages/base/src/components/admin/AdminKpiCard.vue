<script setup>
defineProps({
  label: {
    type: String,
    required: true,
  },
  value: {
    type: [String, Number],
    default: '—',
  },
  subtext: {
    type: String,
    default: '',
  },
  to: {
    type: String,
    default: '',
  },
  linkText: {
    type: String,
    default: '',
  },
  alert: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  variant: {
    type: String,
    default: 'default',
    validator: (v) => ['default', 'ops', 'inventory'].includes(v),
  },
  icon: {
    type: Object,
    default: null,
  },
})

/*
 * Chaque variante porte `bg-white` : sur le thème vert, c'est cette classe qui
 * repose le contexte clair (voir theme-dark.css). Sans elle, la carte resterait
 * en contexte « sur vert » et ses gris passeraient en blanc.
 *
 * Le dégradé de la variante `ops` finit sur `to-cream` plutôt que `to-cream/40` :
 * `cream` étant une variable CSS, Tailwind n'émet pas la version avec opacité, et
 * le dégradé s'éteignait donc en transparent — invisible sur le fond beige d'un
 * site clair, mais laissant passer le vert sur le thème sombre.
 */
const variantClasses = {
  default: 'border-gray-100 bg-white',
  ops: 'border-primary/10 bg-white bg-gradient-to-br from-white to-cream',
  inventory: 'border-gray-100 bg-white',
}
</script>

<template>
  <component
    :is="to ? 'RouterLink' : 'div'"
    :to="to || undefined"
    class="relative rounded-xl border p-5 shadow-sm transition-shadow"
    :class="[
      variantClasses[variant] || variantClasses.default,
      to ? 'hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary' : '',
      alert ? 'ring-2 ring-amber-400/60 border-amber-200' : '',
    ]"
  >
    <div v-if="loading" class="animate-pulse space-y-3">
      <div class="h-4 w-24 rounded bg-gray-200" />
      <div class="h-8 w-16 rounded bg-gray-200" />
      <div class="h-3 w-32 rounded bg-gray-100" />
    </div>
    <template v-else>
      <div class="flex items-start justify-between gap-3">
        <p class="text-sm font-medium text-gray-600">{{ label }}</p>
        <div
          v-if="icon"
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          :class="alert ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'"
        >
          <component :is="icon" class="h-5 w-5" :stroke-width="1.75" />
        </div>
      </div>
      <p class="mt-2 text-3xl font-bold tracking-tight text-text-main">{{ value }}</p>
      <p v-if="subtext" class="mt-1 text-xs text-gray-500">{{ subtext }}</p>
      <p v-if="linkText && to" class="mt-3 text-xs font-medium text-primary">{{ linkText }}</p>
    </template>
  </component>
</template>
