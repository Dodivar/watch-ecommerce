<template>
  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path
      v-if="name === 'atelier' || name === 'workshop'"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="1.75"
      d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M9.879 16.122A3 3 0 1012.015 3.015L3 12v4h4l8.879-8.879z"
    />
    <path
      v-else-if="name === 'piles' || name === 'battery'"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="1.75"
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
    <path
      v-else-if="name === 'bracelets' || name === 'strap'"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="1.75"
      d="M4 6h16M4 10h16M4 14h16M4 18h16"
    />
    <path
      v-else-if="name === 'avantages' || name === 'payment'"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="1.75"
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
    />
    <path
      v-else
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="1.75"
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
</template>

<script setup>
defineProps({
  name: {
    type: String,
    default: 'default',
  },
})
</script>
