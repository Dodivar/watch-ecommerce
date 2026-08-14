<template>
  <section
    class="min-h-screen bg-white text-text-main flex flex-col items-center justify-center px-6 py-16"
  >
    <div class="max-w-2xl text-center space-y-8">
      <div class="flex flex-col items-center gap-2">
        <h2 class="text-primary uppercase text-5xl font-bold">
          Oups... 404
        </h2>
      </div>

      <div class="space-y-3">
        <h1 class="text-3xl font-semibold">
          On dirait que même nos montres les plus précises ont perdu cette page.
        </h1>
        <p class="text-lg text-muted">
          Pas de panique&nbsp;! Profitons-en pour revenir à l’essentiel et
          retrouver notre collection depuis l’accueil.
        </p>
      </div>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <RouterLink
          to="/"
          class="inline-flex items-center justify-center px-6 py-3 rounded-full text-white bg-primary hover:bg-primary/90 transition"
        >
          Retourner à l’accueil
        </RouterLink>
        <button
          type="button"
          class="inline-flex items-center justify-center px-6 py-3 rounded-full border border-primary text-primary hover:bg-primary/5 transition"
          @click="$router.back()"
        >
          Revenir en arrière
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
</style>

