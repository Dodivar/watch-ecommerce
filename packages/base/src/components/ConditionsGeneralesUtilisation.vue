<template>
  <div class="min-h-screen bg-white">
    <section class="py-12 border-b border-border-subtle">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl lg:text-4xl font-bold text-text-main mb-3">
          Conditions générales d’utilisation
        </h1>
        <p class="text-muted text-sm">
          Dernière mise à jour : 31 mars 2026
        </p>
        <p class="mt-6 text-text-main/85 leading-relaxed">
          Les présentes conditions générales d’utilisation (ci-après les « CGU ») encadrent l’accès et
          l’usage du site exploité par <strong class="text-text-main">{{ LEGAL_COMPANY_NAME }}</strong>. En
          naviguant sur le site, vous acceptez sans réserve les CGU en vigueur.
        </p>
      </div>
    </section>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-text-main/85 leading-relaxed">
      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">1. Objet</h2>
        <p>
          Les CGU définissent les règles applicables à la consultation du site et, le cas échéant, à
          l’utilisation des services proposés (informations sur la sélection de montres, blog, formulaires de
          contact ou d’estimation, et paiement en ligne lorsque activé). Elles complètent toute condition
          particulière ou document contractuel qui vous serait communiqué lors d’une transaction.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">2. Accès au site</h2>
        <p>
          Le site est accessible en continu, sous réserve des opérations de maintenance, des contraintes
          techniques ou des cas de force majeure. {{ LEGAL_COMPANY_NAME }} met en œuvre les moyens raisonnables
          pour en assurer la disponibilité sans garantir une absence totale d’interruption.
        </p>
        <p class="mt-3">
          Vous vous engagez à disposer des moyens et des compétences nécessaires pour accéder au site et à ne
          pas utiliser le site à des fins illicites ou de nature à porter atteinte aux droits de tiers.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">3. Services et contenus</h2>
        <p>
          Le site présente l’activité de {{ LEGAL_COMPANY_NAME }}, sa sélection de montres, des contenus
          éditoriaux (notamment le blog) et des moyens de prise de contact ou de demande d’estimation. Les
          descriptions, photographies et informations ont une vocation informative. Elles ne constituent pas
          une offre contractuelle ferme tant qu’un accord commercial distinct ne vous a pas été confirmé selon
          les modalités habituelles de {{ LEGAL_COMPANY_NAME }}.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">4. Commande et paiement en ligne</h2>
        <template v-if="PURCHASE_ENABLED">
          <p>
            Lorsque l’achat en ligne est proposé sur le site, le parcours de commande et de paiement peut
            s’effectuer via notre prestataire <strong class="text-text-main">Stripe</strong>. Les conditions
            financières, de livraison et d’exercice de vos droits (y compris le droit de rétractation lorsqu’il
            s’applique) vous sont communiquées avant la validation de la commande. L’exécution du contrat de
            vente est soumise aux conditions qui vous sont alors précisées et, le cas échéant, aux conditions
            générales de vente applicables.
          </p>
        </template>
        <template v-else>
          <p>
            À la date des présentes CGU, la fonctionnalité d’achat en ligne peut être désactivée sur le site.
            Toute commande ou règlement s’effectue alors selon les modalités qui vous sont communiquées
            directement par {{ LEGAL_COMPANY_NAME }}. Lorsque le paiement en ligne est de nouveau proposé, les
            règles applicables pourront notamment inclure le recours à notre prestataire
            <strong class="text-text-main">Stripe</strong>, dans le respect des informations précontractuelles
            qui vous seront alors fournies.
          </p>
        </template>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">5. Comportement des utilisateurs</h2>
        <p>
          Il est interdit notamment : de porter atteinte à la sécurité ou au bon fonctionnement du site ; de
          tenter d’accéder de manière non autorisée aux systèmes ou données ; de diffuser des contenus
          illicites, diffamatoires ou trompeurs ; d’usurper l’identité d’un tiers. {{ LEGAL_COMPANY_NAME }}
          se réserve le droit de suspendre ou de limiter l’accès en cas de manquement grave ou répété.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">6. Propriété intellectuelle</h2>
        <p>
          Les contenus du site (textes, images, structure, marques et logos de {{ LEGAL_COMPANY_NAME }}) sont
          protégés. Toute utilisation non autorisée est interdite. Les marques des fabricants mentionnées ou
          illustrées appartiennent à leurs titulaires respectifs.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">7. Responsabilité</h2>
        <p>
          Les informations publiées le sont en l’état. {{ LEGAL_COMPANY_NAME }} ne saurait être tenue
          responsable des imprécisions ponctuelles, de l’indisponibilité temporaire du site ou des dommages
          indirects liés à l’usage du site, dans les limites prévues par la loi.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">8. Liens hypertextes</h2>
        <p>
          Le site peut contenir des liens vers des sites tiers. {{ LEGAL_COMPANY_NAME }} n’exerce pas de
          contrôle sur ces sites et décline toute responsabilité quant à leur contenu ou leurs pratiques.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">9. Modification des CGU</h2>
        <p>
          {{ LEGAL_COMPANY_NAME }} peut adapter les CGU pour refléter l’évolution du site ou des obligations
          légales. La date de « dernière mise à jour » en tête de page est modifiée en conséquence. La poursuite
          de la navigation après la mise en ligne des CGU révisées vaut acceptation des nouvelles modalités,
          sauf disposition impérative contraire.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">10. Données personnelles et droit applicable</h2>
        <p>
          Le traitement des données collectées sur le site est détaillé dans notre
          <RouterLink
            to="/politique-confidentialite"
            class="font-medium text-primary underline decoration-primary/40 hover:text-primary-hover"
          >politique de confidentialité</RouterLink
          >.
        </p>
        <p class="mt-3">
          Les CGU sont régies par le <strong class="text-text-main">droit français</strong>. En l’absence de
          règlement amiable, et sous réserve des règles d’ordre public et des attributions de compétence
          spécifiques (notamment en matière de consommation), les tribunaux français seront seuls compétents.
        </p>
        <p class="mt-3">
          Pour toute question relative aux présentes CGU :
          <a
            :href="'mailto:' + EMAIL_CONTACT"
            class="font-medium text-primary underline decoration-primary/40 hover:text-primary-hover"
          >{{ EMAIL_CONTACT }}</a
          >.
        </p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { useHead } from '@vueuse/head'
import { BASE_URL, EMAIL_CONTACT, LEGAL_COMPANY_NAME, PURCHASE_ENABLED } from '@/config'
import { getSiteConfig } from '@/site/getSiteConfig.js'

const seo = getSiteConfig().seo.cgu

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
      content: `${BASE_URL}/conditions-generales-utilisation`,
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
      href: `${BASE_URL}/conditions-generales-utilisation`,
    },
  ],
})
</script>

<script>
export default {
  name: 'ConditionsGeneralesUtilisation',
}
</script>
