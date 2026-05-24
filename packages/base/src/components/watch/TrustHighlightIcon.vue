<template>
  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <template v-if="name === 'guarantee'">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.75"
        d="M8 3h6l4 4v14a1 1 0 01-1 1H8a1 1 0 01-1-1V4a1 1 0 011-1z"
      />
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.75"
        d="M14 3v4h4"
      />
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.75"
        d="M9 12h6M9 15h4"
      />
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.75"
        d="M9.5 18.5l1.5 1.5 3.5-3.5"
      />
    </template>
    <path
      v-else-if="name === 'payment'"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="1.75"
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    />
    <path
      v-else-if="name === 'pickup' || name === 'store'"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="1.75"
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    />
    <path
      v-else-if="name === 'shipping' || name === 'envoi'"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="1.75"
      d="M3 7h10v7H3V7zm10 0h3.5L19 10v4h-6V7zM6.5 17a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm9 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
    />
    <path
      v-else-if="name === 'return' || name === 'retour'"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="1.75"
      d="M3 10h10a4 4 0 014 4v0a4 4 0 01-4 4H5m0 0l3-3m-3 3l3 3"
    />
    <path
      v-else-if="name === 'experience'"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="1.75"
      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
    />
    <template v-else-if="name === 'authentic'">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.75"
        d="M1.458 12C2.732 7.943 6.522 5 12 5s9.268 2.943 10.542 7c-1.274 4.057-5.064 7-10.542 7s-9.268-2.943-10.542-7z"
      />
      <circle cx="12" cy="12" r="3" stroke-width="1.75" fill="none" />
    </template>
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
    default: 'shield',
  },
})
</script>
