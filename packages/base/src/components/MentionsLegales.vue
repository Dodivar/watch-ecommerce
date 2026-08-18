<template>
  <div class="min-h-screen bg-white">
    <section class="py-12 border-b border-gray-100">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl lg:text-4xl font-bold text-text-main mb-3">
          Mentions légales
        </h1>
        <p class="text-gray-600 text-sm">
          Dernière mise à jour : 31 mars 2026
        </p>
        <p class="mt-6 text-gray-700 leading-relaxed">
          Les présentes mentions légales s’appliquent au site édité par
          <strong class="text-text-main">{{ LEGAL_COMPANY_NAME }}</strong>, conformément aux obligations
          en vigueur en France, notamment la loi pour la confiance dans l’économie numérique (LCEN).
        </p>
      </div>
    </section>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-gray-700 leading-relaxed">
      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">1. Éditeur du site</h2>
        <p>
          Le site est édité par <strong class="text-text-main">{{ LEGAL_COMPANY_NAME }}</strong>.
        </p>
        <ul v-if="hasLegalDetails" class="mt-3 list-disc pl-5 space-y-1">
          <li v-if="LEGAL_ADDRESS">{{ LEGAL_ADDRESS }}</li>
          <li v-if="LEGAL_SIRET">SIRET : {{ LEGAL_SIRET }}</li>
        </ul>
        <p v-else class="mt-3 text-sm text-gray-600">
          Les informations détaillées d’immatriculation (adresse du siège, SIRET) peuvent être complétées
          via les variables d’environnement décrites dans la documentation interne du projet, afin d’assurer
          la conformité lorsque ces données sont publiquement exigées.
        </p>
        <p class="mt-3">
          Contact :
          <a
            :href="'mailto:' + EMAIL_CONTACT"
            class="font-medium text-primary underline decoration-primary/40 hover:text-primary-hover"
          >{{ EMAIL_CONTACT }}</a
          >.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">2. Directeur de la publication</h2>
        <p>
          Le directeur de la publication est le <strong class="text-text-main">représentant légal</strong> de
          {{ LEGAL_COMPANY_NAME }}, tel que désigné dans les statuts de la société (ou, à défaut de personne
          morale, la personne physique responsable de l’édition du site). Toute demande relative à cette
          mention peut être adressée à l’adresse
          <a
            :href="'mailto:' + EMAIL_CONTACT"
            class="font-medium text-primary underline decoration-primary/40 hover:text-primary-hover"
          >{{ EMAIL_CONTACT }}</a
          >.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">3. Hébergement</h2>
        <p>
          Le site est hébergé par <strong class="text-text-main">Vercel Inc.</strong>, 340 South Lemon Avenue,
          bureau 4133, Walnut, CA 91789, États-Unis.
        </p>
        <p class="mt-2">
          Site du prestataire :
          <a
            href="https://vercel.com"
            class="font-medium text-primary underline decoration-primary/40 hover:text-primary-hover"
            rel="noopener noreferrer"
            target="_blank"
          >vercel.com</a
          >.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">4. Propriété intellectuelle</h2>
        <p>
          L’ensemble des éléments composant le site (structure, textes, visuels, logo, bases de données le cas
          échéant) est la propriété de {{ LEGAL_COMPANY_NAME }} ou de ses partenaires, sauf mention contraire.
          Toute reproduction, représentation, modification ou exploitation non autorisée est interdite et
          peut constituer une contrefaçon au sens du Code de la propriété intellectuelle.
        </p>
        <p class="mt-3">
          Les dénominations, marques et signes distinctifs des fabricants de montres cités ou illustrés le
          sont à titre d’information ; ils demeurent la propriété exclusive de leurs titulaires.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">5. Données personnelles</h2>
        <p>
          Le traitement des données personnelles collectées via le site est décrit dans notre
          <RouterLink
            to="/politique-confidentialite"
            class="font-medium text-primary underline decoration-primary/40 hover:text-primary-hover"
          >politique de confidentialité</RouterLink
          >.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">6. Médiation et règlement des litiges</h2>
        <p>
          Pour toute difficulté liée à une commande ou à un service, contactez-nous en priorité à
          <a
            :href="'mailto:' + EMAIL_CONTACT"
            class="font-medium text-primary underline decoration-primary/40 hover:text-primary-hover"
          >{{ EMAIL_CONTACT }}</a
          >.
        </p>
        <p class="mt-3">
          Conformément aux articles L.612-1 et suivants du Code de la consommation, vous pouvez recourir
          gratuitement à un médiateur de la consommation en vue de la résolution amiable d’un litige qui vous
          oppose à un professionnel, dans un délai d’un an à compter de votre réclamation écrite auprès de
          {{ LEGAL_COMPANY_NAME }}. Les coordonnées du médiateur désigné, le cas échéant, vous sont communiquées
          sur demande ou figurent sur les documents contractuels qui vous sont remis. À défaut de désignation
          spécifique, les modalités applicables sont celles prévues par la réglementation en vigueur.
        </p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useHead } from '@vueuse/head'
import {
  EMAIL_CONTACT,
  LEGAL_ADDRESS,
  LEGAL_COMPANY_NAME,
  LEGAL_SIRET,
  CANONICAL_BASE_URL,
} from '@/config'
import { getSiteConfig } from '@/site/getSiteConfig.js'

const hasLegalDetails = computed(() => Boolean(LEGAL_ADDRESS || LEGAL_SIRET))

const seo = getSiteConfig().seo.mentions

useHead({
  title: seo.title,
  meta: [
    {
      name: 'description',
      content: seo.metaDescription,
    },
    {
      property: 'og:title',
      content: seo.ogTitle,
    },
    {
      property: 'og:description',
      content: seo.ogDescription,
    },
    {
      property: 'og:url',
      content: `${CANONICAL_BASE_URL}/mentions-legales`,
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image',
    },
    {
      name: 'twitter:title',
      content: seo.twitterTitle,
    },
    {
      name: 'twitter:description',
      content: seo.twitterDescription,
    },
  ],
  link: [
    {
      rel: 'canonical',
      href: `${CANONICAL_BASE_URL}/mentions-legales`,
    },
  ],
})
</script>

<script>
export default {
  name: 'MentionsLegales',
}
</script>
