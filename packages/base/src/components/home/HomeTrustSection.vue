<script setup>
import { BadgeCheck, Globe, ShieldCheck, UserRound } from '@lucide/vue'
</script>

<template>
  <!-- Respiration beige entre le héros vert et les blocs de contenu blancs. -->
  <section class="surface-sand py-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12 max-w-3xl mx-auto">
        <p class="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          Nos engagements
        </p>
        <h2 class="text-3xl lg:text-4xl font-bold text-text-main mb-4">
          Achetez ou recherchez votre montre en toute confiance
        </h2>
        <p class="text-lg text-muted">
          Profitez d'un accompagnement personnalisé, d'une sécurité totale et de tous les avantages de notre réseau d'experts pour un achat serein ou la quête du modèle qui vous fait rêver.
        </p>
      </div>
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="card-elevated text-center p-7 rounded-md">
          <div
            class="icon-badge-forest w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <UserRound class="h-8 w-8" :stroke-width="2" />
          </div>
          <h3 class="text-lg font-semibold mb-2 text-text-main">Accompagnement personnalisé</h3>
          <p class="text-muted">
            Conseils, sourcing sur-mesure et suivi tout au long de votre projet d'achat ou de recherche de montre.
          </p>
        </div>
        <div class="card-elevated text-center p-7 rounded-md">
          <div
            class="icon-badge-forest w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <ShieldCheck class="h-8 w-8" :stroke-width="2" />
          </div>
          <h3 class="text-lg font-semibold mb-2 text-text-main">Authenticité &amp; sécurité</h3>
          <p class="text-muted">
            Chaque montre est minutieusement vérifiée : authenticité certifiée, paiement sécurisé, transaction protégée.
          </p>
        </div>
        <div class="card-elevated text-center p-7 rounded-md">
          <div
            class="icon-badge-forest w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Globe class="h-8 w-8" :stroke-width="2" />
          </div>
          <h3 class="text-lg font-semibold mb-2 text-text-main">Sourcing &amp; réseau international</h3>
          <p class="text-muted">
            Profitez de notre réseau français et européen pour accéder à des modèles rares, exclusifs ou au meilleur rapport qualité/prix.
          </p>
        </div>
        <div class="card-elevated text-center p-7 rounded-md">
          <div
            class="icon-badge-forest w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <BadgeCheck class="h-8 w-8" :stroke-width="2" />
          </div>
          <h3 class="text-lg font-semibold mb-2 text-text-main">Transparence &amp; satisfaction</h3>
          <p class="text-muted">
            Processus limpide, aucune commission cachée, votre tranquillité est notre priorité.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
