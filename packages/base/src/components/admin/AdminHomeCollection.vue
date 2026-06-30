<script setup>
import AdminHomeFeatured from './AdminHomeFeatured.vue'
</script>

<template>
  <AdminHomeFeatured
    context="collection"
    title="Sélection accueil — Aperçu collection"
    description="Montres mises en avant dans le bloc « aperçu collection » de l'accueil. Si la sélection est vide, le bloc affiche automatiquement les dernières montres disponibles."
    empty-hint="Aucune montre sélectionnée — le bloc affichera automatiquement les dernières montres disponibles."
  />
</template>
