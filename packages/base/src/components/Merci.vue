<script setup>
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import { t, tc } from '@/i18n'

const router = useRouter()
const countdown = ref(5)

onMounted(() => {
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
      router.push('/')
    }
  }, 1000)
})
</script>

<template>
  <section class="min-h-screen flex flex-col items-center justify-center px-4 text-center">
    <div class="max-w-xl">
      <svg
        class="mx-auto mb-6 h-16 w-16 text-primary"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <h1 class="text-3xl font-bold text-text-main mb-4">{{ t('thanks.title') }}</h1>
      <p class="text-lg text-gray-600 mb-6">
        {{
          $route.query.from == 'estimation'
            ? t('thanks.estimation')
            : $route.query.from == 'contact'
              ? t('thanks.contact')
              : $route.query.from == 'repair'
                ? t('thanks.repair')
                : t('thanks.sourcing')
        }}
      </p>
      <!-- RouterLink et non `<a href>` : une ancre brute contourne la base d'historique et
           renverrait un visiteur anglophone ou germanophone vers l'accueil français. -->
      <RouterLink
        to="/"
        class="inline-block bg-primary text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary-hover transition"
      >
        {{ t('notFound.backHome') }}
      </RouterLink>
      <p class="mt-8 text-sm text-gray-400">{{ tc('thanks.redirect', countdown) }}</p>
    </div>
  </section>
</template>

<style scoped></style>
