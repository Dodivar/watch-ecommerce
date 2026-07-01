<template>
  <div class="min-h-screen bg-white">
    <section class="py-12 border-b border-gray-100">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl lg:text-4xl font-bold text-text-main mb-3">
          Politique de confidentialité
        </h1>
        <p class="text-gray-600 text-sm">
          Dernière mise à jour : 1 juillet 2026
        </p>
        <p class="mt-6 text-gray-700 leading-relaxed">
          La présente politique explique comment {{ LEGAL_COMPANY_NAME }} traite les données personnelles
          lorsque vous utilisez le site, dans le respect du Règlement général sur la protection des
          données (RGPD) et de la loi française « Informatique et Libertés ».
        </p>
      </div>
    </section>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-gray-700 leading-relaxed">
      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">1. Responsable du traitement</h2>
        <p>
          Le responsable du traitement est <strong class="text-text-main">{{ LEGAL_COMPANY_NAME }}</strong>.
        </p>
        <ul v-if="hasLegalDetails" class="mt-3 list-disc pl-5 space-y-1">
          <li v-if="LEGAL_ADDRESS">{{ LEGAL_ADDRESS }}</li>
          <li v-if="LEGAL_SIRET">SIRET : {{ LEGAL_SIRET }}</li>
        </ul>
        <p class="mt-3">
          Pour toute question relative à vos données personnelles :
          <a
            :href="'mailto:' + EMAIL_CONTACT"
            class="font-medium text-primary underline decoration-primary/40 hover:text-primary-hover"
          >{{ EMAIL_CONTACT }}</a
          >.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">2. Données collectées et finalités</h2>

        <h3 class="text-lg font-semibold text-text-main mt-6 mb-2">2.1 Navigation et mesure d’audience</h3>
        <p>
          Nous pouvons utiliser <strong class="text-text-main">Google Analytics</strong> pour mesurer
          la fréquentation et comprendre l’usage du site (pages vues, parcours, type d’appareil, etc.).
          Ces traceurs ne sont déposés et le script n’est chargé <strong class="text-text-main">qu’après votre
          consentement</strong>, via le bandeau cookies. Vous pouvez retirer ou modifier votre choix à tout
          moment depuis le lien « Préférences cookies » en pied de page.
        </p>
        <p class="mt-2">
          Base juridique : <strong class="text-text-main">consentement</strong> (article 6-1-a du RGPD).
        </p>

        <h3 class="text-lg font-semibold text-text-main mt-6 mb-2">2.2 Formulaires (estimation, recherche personnalisée, contact)</h3>
        <p>
          Lorsque vous nous adressez une demande via un formulaire, nous traitons les informations que vous
          saisissez : coordonnées (nom, e-mail, téléphone le cas échéant), contenu du message, et pièces
          jointes si vous en téléchargez. Ces données nous permettent de <strong class="text-text-main">traiter votre
          demande</strong>, de vous recontacter et de faire avancer votre projet (conseil, estimation, mise en
          relation commerciale).
        </p>
        <p class="mt-2">
          Base juridique : <strong class="text-text-main">exécution de mesures précontractuelles</strong> ou
          <strong class="text-text-main">exécution du contrat</strong> lorsque la demande aboutit à une relation
          commerciale (article 6-1-b du RGPD), et le cas échéant <strong class="text-text-main">intérêt légitime</strong>
          pour le suivi de la relation (article 6-1-f).
        </p>

        <h3 class="text-lg font-semibold text-text-main mt-6 mb-2">2.3 Commande et paiement en ligne</h3>
        <p>
          Si vous réglez un achat en ligne, les données nécessaires au paiement sont traitées par notre
          prestataire <strong class="text-text-main">Stripe</strong>. Nous ne conservons pas sur notre site
          l’intégralité de vos données bancaires (numéro de carte complet) : elles sont gérées par Stripe
          selon ses propres règles de sécurité.
        </p>
        <p class="mt-2">
          Base juridique : <strong class="text-text-main">exécution du contrat</strong> (article 6-1-b du RGPD).
        </p>

        <h3 class="text-lg font-semibold text-text-main mt-6 mb-2">2.4 Carte d’accès à la boutique</h3>
        <p>
          Sur les pages Contact et À propos, une carte interactive peut afficher l’emplacement de notre
          boutique. Selon la configuration du site, cette carte est fournie par
          <strong class="text-text-main">Google Maps</strong> (chargement du script Maps JavaScript API) ou par
          un fond de carte OpenStreetMap. L’affichage Google peut transmettre à Google des données techniques
          liées à l’affichage de la carte (adresse IP, requêtes de tuiles).
        </p>
        <p class="mt-2">
          Base juridique : <strong class="text-text-main">intérêt légitime</strong> (informer sur notre
          localisation, article 6-1-f du RGPD).
        </p>

        <template v-if="features.newsletter">
          <h3 class="text-lg font-semibold text-text-main mt-6 mb-2">2.5 Newsletter et communications commerciales</h3>
          <p>
            Vous recevez notre newsletter uniquement si vous y avez <strong class="text-text-main">explicitement
            consenti</strong> : via le formulaire d’inscription du site, ou en cochant la case dédiée lors d’une
            prise de contact (contact, rendez-vous, estimation, recherche) ou d’un achat. Nous traitons alors
            votre adresse e-mail (et, le cas échéant, votre nom) pour vous adresser nos actualités, nouveautés
            et offres. L’envoi est assuré par notre prestataire d’emailing
            <strong class="text-text-main">Mailjet (Sinch)</strong>. Chaque message contient un lien de
            <strong class="text-text-main">désinscription</strong> vous permettant de retirer votre consentement
            à tout moment ; la désinscription est prise en compte sur l’ensemble de nos envois.
          </p>
          <p class="mt-2">
            Base juridique : <strong class="text-text-main">consentement</strong> (article 6-1-a du RGPD). Le
            retrait du consentement (désinscription) est possible à tout moment et sans frais, et n’affecte pas
            la licéité des envois effectués avant ce retrait.
          </p>
        </template>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">3. Destinataires et sous-traitants</h2>
        <p class="mb-3">Les données peuvent être communiquées aux catégories de destinataires suivantes :</p>
        <ul class="list-disc pl-5 space-y-2">
          <li>
            <strong class="text-text-main">Google Ireland Limited</strong> (Google Analytics, carte boutique
            Google Maps le cas échéant, autocomplétion d’adresse au checkout si activée) —
            <a
              href="https://policies.google.com/privacy"
              class="font-medium text-primary underline decoration-primary/40 hover:text-primary-hover"
              rel="noopener noreferrer"
              target="_blank"
            >Politique de confidentialité Google</a
            > ;
          </li>
          <li>
            <strong class="text-text-main">Stripe</strong>, pour le traitement des paiements —
            <a
              href="https://stripe.com/fr/privacy"
              class="font-medium text-primary underline decoration-primary/40 hover:text-primary-hover"
              rel="noopener noreferrer"
              target="_blank"
            >Politique de confidentialité Stripe</a
            > ;
          </li>
          <li v-if="features.newsletter">
            <strong class="text-text-main">Mailjet (Sinch)</strong>, pour l’envoi de nos emails
            (newsletter et messages transactionnels) —
            <a
              href="https://www.mailjet.com/legal/privacy-policy/"
              class="font-medium text-primary underline decoration-primary/40 hover:text-primary-hover"
              rel="noopener noreferrer"
              target="_blank"
            >Politique de confidentialité Mailjet</a
            > ;
          </li>
          <li>
            nos <strong class="text-text-main">prestataires d’hébergement</strong> (site et API) et
            <strong class="text-text-main">d’infrastructure messagerie</strong>, dans la stricte mesure nécessaire
            au fonctionnement technique du service ;
          </li>
          <li>
            le personnel habilité de <strong class="text-text-main">{{ LEGAL_COMPANY_NAME }}</strong>, sur la base
            d’un besoin d’en connaître.
          </li>
        </ul>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">4. Transferts hors de l’Espace économique européen</h2>
        <p>
          Certains sous-traitants (dont Google et Stripe) peuvent être établis dans des pays situés hors de
          l’EEE. Le cas échéant, des garanties appropriées sont mises en place, telles que les
          <strong class="text-text-main">clauses contractuelles types</strong> approuvées par la Commission
          européenne ou d’autres mécanismes reconnus par la réglementation applicable.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">5. Durées de conservation</h2>
        <ul class="list-disc pl-5 space-y-2">
          <li>
            Données liées aux <strong class="text-text-main">formulaires</strong> : conservées le temps utile au
            traitement de votre demande et au suivi de la relation commerciale, puis archivées ou supprimées
            selon nos obligations légales (comptabilité, litiges) ;
          </li>
          <li>
            Données liées au <strong class="text-text-main">paiement</strong> : selon les durées définies par Stripe
            et la loi ;
          </li>
          <li>
            Données issues de <strong class="text-text-main">Google Analytics</strong> : selon la configuration du
            service et la durée de validité de votre consentement ; sans consentement renouvelé, les traceurs
            concernés ne sont pas utilisés.
          </li>
          <li v-if="features.newsletter">
            Données d’<strong class="text-text-main">abonnement à la newsletter</strong> : conservées jusqu’à
            votre désinscription, puis supprimées ou anonymisées.
          </li>
        </ul>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">6. Vos droits</h2>
        <p class="mb-3">Conformément au RGPD, vous disposez des droits suivants :</p>
        <ul class="list-disc pl-5 space-y-2 mb-4">
          <li>droit d’<strong class="text-text-main">accès</strong> et de <strong class="text-text-main">rectification</strong> ;</li>
          <li>droit à l’<strong class="text-text-main">effacement</strong> et à la <strong class="text-text-main">limitation</strong> du traitement ;</li>
          <li>droit d’<strong class="text-text-main">opposition</strong> pour motifs légitimes ;</li>
          <li>droit à la <strong class="text-text-main">portabilité</strong> lorsque le traitement est fondé sur le consentement ou le contrat et mis en œuvre par voie automatisée ;</li>
          <li>droit de définir des <strong class="text-text-main">directives post-mortem</strong> relatives à vos données.</li>
        </ul>
        <p>
          Pour exercer ces droits, adressez-nous une demande à
          <a
            :href="'mailto:' + EMAIL_CONTACT"
            class="font-medium text-primary underline decoration-primary/40 hover:text-primary-hover"
          >{{ EMAIL_CONTACT }}</a
          >. Nous pourrons vous demander de justifier votre identité si nécessaire.
        </p>
        <p class="mt-3">
          Vous pouvez également introduire une réclamation auprès de la
          <a
            href="https://www.cnil.fr"
            class="font-medium text-primary underline decoration-primary/40 hover:text-primary-hover"
            rel="noopener noreferrer"
            target="_blank"
          >CNIL</a
          > (Commission nationale de l’informatique et des libertés).
        </p>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">7. Sécurité</h2>
        <p>
          Nous mettons en œuvre des mesures techniques et organisationnelles appropriées (communication
          sécurisée, hébergement professionnel, contrôle des accès) pour protéger vos données contre
          l’accès non autorisé, la perte ou l’altération.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">8. Modifications</h2>
        <p>
          Nous pouvons adapter la présente politique pour refléter l’évolution du site ou des obligations
          légales. La date de « dernière mise à jour » en tête de page sera modifiée en conséquence.
        </p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useHead } from '@vueuse/head'
import {
  BASE_URL,
  EMAIL_CONTACT,
  LEGAL_ADDRESS,
  LEGAL_COMPANY_NAME,
  LEGAL_SIRET,
} from '@/config'
import { getSiteConfig } from '@/site/getSiteConfig.js'

const hasLegalDetails = computed(() => Boolean(LEGAL_ADDRESS || LEGAL_SIRET))

const features = getSiteConfig().features

const seo = getSiteConfig().seo.politique

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
      content: `${BASE_URL}/politique-confidentialite`,
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
      href: `${BASE_URL}/politique-confidentialite`,
    },
  ],
})
</script>

<script>
export default {
  name: 'PolitiqueConfidentialite',
}
</script>
