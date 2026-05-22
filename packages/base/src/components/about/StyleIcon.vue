<template>
  <svg
    v-if="name === 'sport'"
    class="h-7 w-7"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden="true"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
  </svg>
  <svg
    v-else-if="name === 'elegance'"
    class="h-7 w-7"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden="true"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
    />
  </svg>
  <svg
    v-else
    class="h-7 w-7"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="7" stroke-width="2" />
    <circle cx="12" cy="12" r="2" stroke-width="2" />
    <path stroke-linecap="round" stroke-width="2" d="M12 5V3M12 21v-2M5 12H3M21 12h-2" />
  </svg>
</template>

<script setup>
defineProps({
  name: {
    type: String,
    default: 'mechanics',
  },
})
</script>
