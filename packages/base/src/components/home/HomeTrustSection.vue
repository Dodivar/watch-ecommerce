<script setup>
import { BadgeCheck, Globe, ShieldCheck, UserRound } from '@lucide/vue'
</script>

<template>
  <!-- Bandeau d'ancrage vert : rupture au milieu du rythme beige/blanc. -->
  <section class="py-16 bg-primary">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-10">
        <h2 class="text-3xl lg:text-4xl font-bold text-white mb-3">
          Achetez ou recherchez votre montre en toute confiance
        </h2>
        <p class="text-xl text-white/75 max-w-4xl mx-auto">
          Profitez d'un accompagnement personnalisé, d'une sécurité totale et de tous les avantages de notre réseau d'experts pour un achat serein ou la quête du modèle qui vous fait rêver.
        </p>
      </div>
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="text-center p-6 rounded-md bg-white shadow-lg transition-colors">
          <div
            class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-3"
          >
            <UserRound class="h-8 w-8 text-white" :stroke-width="2" />
          </div>
          <h3 class="text-lg font-semibold mb-2">Accompagnement personnalisé</h3>
          <p class="text-gray-600">
            Conseils, sourcing sur-mesure et suivi tout au long de votre projet d'achat ou de recherche de montre.
          </p>
        </div>
        <div class="text-center p-6 rounded-md bg-white shadow-lg transition-colors">
          <div
            class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-3"
          >
            <ShieldCheck class="h-8 w-8 text-white" :stroke-width="2" />
          </div>
          <h3 class="text-lg font-semibold mb-2">Authenticité & sécurité</h3>
          <p class="text-gray-600">
            Chaque montre est minutieusement vérifiée : authenticité certifiée, paiement sécurisé, transaction protégée.
          </p>
        </div>
        <div class="text-center p-6 rounded-md bg-white shadow-lg transition-colors">
          <div
            class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-3"
          >
            <Globe class="h-8 w-8 text-white" :stroke-width="2" />
          </div>
          <h3 class="text-lg font-semibold mb-2">Sourcing & réseau international</h3>
          <p class="text-gray-600">
            Profitez de notre réseau français et européen pour accéder à des modèles rares, exclusifs ou au meilleur rapport qualité/prix.
          </p>
        </div>
        <div class="text-center p-6 rounded-md bg-white shadow-lg transition-colors">
          <div
            class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-3"
          >
            <BadgeCheck class="h-8 w-8 text-white" :stroke-width="2" />
          </div>
          <h3 class="text-lg font-semibold mb-2">Transparence & satisfaction</h3>
          <p class="text-gray-600">
            Processus limpide, aucune commission cachée, votre tranquillité est notre priorité.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
