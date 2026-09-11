<script setup>
import AdminHomeFeatured from './AdminHomeFeatured.vue'
</script>

<template>
  <AdminHomeFeatured
    context="vitrine"
    title="Accueil — Montre en vitrine"
    description="Montre exposée dans le panneau du hero d'accueil. Seule la première de la liste est affichée ; les suivantes prennent sa place, dans l'ordre, dès qu'elle part à la vente. Si la sélection est vide, la vitrine affiche automatiquement la dernière montre disponible."
    preview-title="Aperçu de la vitrine"
    empty-hint="Aucune montre sélectionnée — la vitrine affichera automatiquement la dernière montre disponible."
  />
</template>
