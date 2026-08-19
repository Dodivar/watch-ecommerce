<script setup>
import { Check, Mail } from '@lucide/vue'
import { scrollAnimation } from '@/animation'
import { WHATSAPP_NUMBER, EMAIL_CONTACT } from '@/config'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { t } from '@/i18n'

import { onMounted } from 'vue'

const brandDisplayName = getSiteConfig().brand.displayName
onMounted(() => {
  scrollAnimation()
})
</script>

<template>
  <section class="py-16">
    <div class="max-w-4xl mx-auto px-4">
      <h1 class="text-4xl font-bold text-text-main mb-8 text-center">Dépôt-Vente de montres</h1>

      <div class="prose-lg max-w-none">
        <p class="text-xl text-gray-600 mb-8 text-center">
          Confiez-nous votre montre et bénéficiez de notre expertise pour une vente optimale
        </p>

        <div class="bg-white rounded-md shadow-lg p-8 mb-12">
          <h2 class="text-2xl font-semibold text-text-main mb-6 text-center">
            Notre service de dépôt-vente
          </h2>
          <p class="mb-6">
            Chez {{ brandDisplayName }}, nous comprenons que la vente d'une montre représente un
            <strong>moment important</strong>. Notre service de dépôt-vente vous offre une solution
            complète et sécurisée pour valoriser votre pièce dans les meilleures conditions.
          </p>

          <div class="grid md:grid-cols-2 gap-8 mb-8">
            <div class="space-y-4">
              <h3 class="text-xl font-semibold text-primary mb-4">Pourquoi nous choisir ?</h3>
              <ul class="space-y-3">
                <li class="flex items-start">
                  <Check class="h-6 w-6 text-primary mr-2 mt-1 shrink-0" :stroke-width="2" />
                  <span>Une visibilité maximale auprès de collectionneurs qualifiés</span>
                </li>
                <li class="flex items-start">
                  <Check class="h-6 w-6 text-primary mr-2 mt-1 shrink-0" :stroke-width="2" />
                  <span>Un accompagnement personnalisé tout au long du processus</span>
                </li>
                <li class="flex items-start">
                  <Check class="h-6 w-6 text-primary mr-2 mt-1 shrink-0" :stroke-width="2" />
                  <span>Une expertise dans l'estimation des montres</span>
                </li>
              </ul>
            </div>

            <div class="space-y-4">
              <h3 class="text-xl font-semibold text-primary mb-4">Nos engagements</h3>
              <ul class="space-y-3">
                <li class="flex items-start">
                  <Check class="h-6 w-6 text-primary mr-2 mt-1 shrink-0" :stroke-width="2" />
                  <span>Une sélection rigoureuse des acheteurs potentiels</span>
                </li>
                <li class="flex items-start">
                  <Check class="h-6 w-6 text-primary mr-2 mt-1 shrink-0" :stroke-width="2" />
                  <span>Des transactions 100% sécurisées</span>
                </li>
                <li class="flex items-start">
                  <Check class="h-6 w-6 text-primary mr-2 mt-1 shrink-0" :stroke-width="2" />
                  <span>Une transparence totale sur les conditions de vente</span>
                </li>
              </ul>
            </div>
          </div>

          <p class="mb-8">
            Notre réseau étendu de collectionneurs et d'amateurs de montres nous permet de garantir
            une exposition optimale de votre pièce. Nous nous chargeons de toute la logistique et de
            la sécurisation de la transaction, vous permettant de vous concentrer sur l'essentiel.
          </p>

          <div class="bg-white rounded-lg p-6 mb-8 shadow-lg">
            <h3 class="text-xl font-semibold text-text-main mb-4">
              Le processus en quelques étapes :
            </h3>
            <ol class="list-decimal list-inside space-y-3 text-gray-700">
              <li>Estimation gratuite et confidentielle de votre montre</li>
              <li>Proposition d'un prix de vente conseillé</li>
              <li>Mise en place du dépôt-vente avec contrat détaillé</li>
              <li>Mise en vente de votre montre sur le marché</li>
              <li>Accompagnement jusqu'à la finalisation de la vente</li>
              <li>Recevez l'argent sur votre compte</li>
            </ol>
          </div>
        </div>

        <div class="text-center">
          <h2 class="text-2xl font-semibold text-text-main mb-6">
            Prêt à nous confier votre montre ?
          </h2>
          <p class="text-lg text-gray-600 mb-8">
            Contactez-nous dès maintenant pour une estimation gratuite et sans engagement
          </p>

          <div class="flex flex-col sm:flex-row justify-center gap-4">
            <a
              :href="'https://wa.me/' + WHATSAPP_NUMBER"
              target="_blank"
              class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-hover transition-colors"
            >
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"
                />
              </svg>
              {{ t('contact.whatsapp') }}
            </a>
            <a
              :href="'mailto:' + EMAIL_CONTACT"
              class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-hover transition-colors"
            >
              <Mail class="w-5 h-5 mr-2" :stroke-width="2" />
              {{ t('contact.byEmail') }}
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.prose {
  max-width: 65ch;
  margin: 0 auto;
}
</style>
