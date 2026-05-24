<template>
  <div class="min-h-screen">
    <section class="py-12">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-3xl lg:text-4xl font-bold text-text-main mb-4">
            Comment estimons-nous votre montre ?
          </h1>
          <p class="text-xl text-gray-600">
            Transparence et expertise au service de votre confiance
          </p>
        </div>

        <!-- Navigation -->
        <div class="mb-6">
          <button
            @click="goBack"
            class="inline-flex items-center text-primary hover:text-green-700 transition-colors cursor-pointer"
          >
            <ArrowLeft class="w-5 h-5 mr-2" :stroke-width="2" />
            Retour
          </button>
        </div>

        <!-- Main Content -->
        <div class="bg-white rounded-md shadow-2xl p-8 md:p-12 space-y-8">
          <!-- Introduction -->
          <div class="prose prose-lg max-w-none">
            <p class="text-lg text-gray-700 leading-relaxed">
              {{ estimationProcessLead }}
              C'est pourquoi nous vous expliquons en détail comment nous procédons pour 
              estimer votre montre de manière précise et équitable.
            </p>
          </div>

          <!-- Process Steps -->
          <div class="space-y-6">
            <h2 class="text-2xl font-bold text-text-main mb-6">Notre processus en 5 étapes</h2>

            <!-- Step 1 -->
            <div class="flex gap-6">
              <div class="flex-shrink-0">
                <div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
                  1
                </div>
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-semibold text-text-main mb-3">
                  Analyse de votre demande
                </h3>
                <p class="text-gray-700 leading-relaxed">
                  Dès réception de votre formulaire, notre équipe d'experts examine toutes les 
                  informations fournies : marque, modèle, année, numéro de série, état général 
                  et accessoires (boîte, papiers). Chaque détail compte pour une estimation précise.
                </p>
              </div>
            </div>

            <!-- Step 2 -->
            <div class="flex gap-6">
              <div class="flex-shrink-0">
                <div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
                  2
                </div>
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-semibold text-text-main mb-3">
                  Vérification d'authenticité
                </h3>
                <p class="text-gray-700 leading-relaxed">
                  Le numéro de série que vous nous communiquez est vérifié dans nos bases de 
                  données et comparé avec les références officielles des marques. Cette étape 
                  cruciale garantit l'authenticité de votre montre et protège votre investissement.
                </p>
              </div>
            </div>

            <!-- Step 3 -->
            <div class="flex gap-6">
              <div class="flex-shrink-0">
                <div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
                  3
                </div>
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-semibold text-text-main mb-3">
                  Évaluation du marché
                </h3>
                <p class="text-gray-700 leading-relaxed">
                  Nous analysons les prix du marché en temps réel en consultant plusieurs sources 
                  fiables : ventes aux enchères récentes, plateformes spécialisées, et notre 
                  propre expérience de transaction. Nous prenons en compte la rareté, la demande 
                  actuelle et les tendances du marché horloger.
                </p>
              </div>
            </div>

            <!-- Step 4 -->
            <div class="flex gap-6">
              <div class="flex-shrink-0">
                <div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
                  4
                </div>
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-semibold text-text-main mb-3">
                  Ajustement selon l'état et les accessoires
                </h3>
                <p class="text-gray-700 leading-relaxed">
                  L'état de votre montre et la présence d'accessoires d'origine (boîte, papiers, 
                  étiquettes) influencent significativement la valeur. Une montre en excellent 
                  état avec tous ses accessoires peut valoir jusqu'à 30% de plus qu'une montre 
                  seule en état moyen.
                </p>
              </div>
            </div>

            <!-- Step 5 -->
            <div class="flex gap-6">
              <div class="flex-shrink-0">
                <div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
                  5
                </div>
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-semibold text-text-main mb-3">
                  Estimation finale et proposition
                </h3>
                <p class="text-gray-700 leading-relaxed">
                  Après avoir croisé toutes ces informations, nous vous proposons une estimation 
                  détaillée et transparente. Cette estimation est valable pendant 30 jours et 
                  peut être ajustée après un examen physique de la montre si vous souhaitez 
                  procéder à une transaction.
                </p>
              </div>
            </div>
          </div>

          <!-- Factors Section -->
          <div class="bg-white rounded-md p-8 shadow-lg">
            <h2 class="text-2xl font-bold text-text-main mb-6">
              Les facteurs qui influencent l'estimation
            </h2>
            <div class="grid md:grid-cols-2 gap-6">
              <div class="flex items-start gap-3">
                <CheckCircle2 class="w-6 h-6 text-primary flex-shrink-0 mt-1" :stroke-width="2" />
                <div>
                  <h4 class="font-semibold text-text-main mb-1">Marque et modèle</h4>
                  <p class="text-sm text-gray-600">Certaines marques et modèles emblématiques conservent mieux leur valeur.</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <CheckCircle2 class="w-6 h-6 text-primary flex-shrink-0 mt-1" :stroke-width="2" />
                <div>
                  <h4 class="font-semibold text-text-main mb-1">Année et rareté</h4>
                  <p class="text-sm text-gray-600">Les éditions limitées et les modèles anciens peuvent avoir une valeur supérieure.</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <CheckCircle2 class="w-6 h-6 text-primary flex-shrink-0 mt-1" :stroke-width="2" />
                <div>
                  <h4 class="font-semibold text-text-main mb-1">État général</h4>
                  <p class="text-sm text-gray-600">L'usure, les rayures et l'entretien régulier impactent la valeur.</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <CheckCircle2 class="w-6 h-6 text-primary flex-shrink-0 mt-1" :stroke-width="2" />
                <div>
                  <h4 class="font-semibold text-text-main mb-1">Accessoires d'origine</h4>
                  <p class="text-sm text-gray-600">Boîte, papiers, étiquettes et certificats augmentent significativement la valeur.</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <CheckCircle2 class="w-6 h-6 text-primary flex-shrink-0 mt-1" :stroke-width="2" />
                <div>
                  <h4 class="font-semibold text-text-main mb-1">Historique de propriété</h4>
                  <p class="text-sm text-gray-600">Un historique documenté peut ajouter de la valeur à certaines pièces.</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <CheckCircle2 class="w-6 h-6 text-primary flex-shrink-0 mt-1" :stroke-width="2" />
                <div>
                  <h4 class="font-semibold text-text-main mb-1">Conjoncture du marché</h4>
                  <p class="text-sm text-gray-600">Les tendances actuelles et la demande influencent les prix.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Trust Section -->
          <div class="border-l-4 border-primary pl-6 py-4">
            <h2 class="text-2xl font-bold text-text-main mb-4">
              Pourquoi nous faire confiance ?
            </h2>
            <ul class="space-y-3 text-gray-700">
<!--               <li class="flex items-start gap-3">
                <CircleCheck class="w-5 h-5 text-primary flex-shrink-0 mt-1" :stroke-width="2" />
                <span><strong>Expertise reconnue</strong> : Notre équipe possède des années d'expérience dans l'horlogerie de luxe.</span>
              </li> -->
              <li class="flex items-start gap-3">
                <CircleCheck class="w-5 h-5 text-primary flex-shrink-0 mt-1" :stroke-width="2" />
                <span><strong>Transparence totale</strong> : Nous vous expliquons clairement notre méthode et nos critères d'évaluation.</span>
              </li>
              <li class="flex items-start gap-3">
                <CircleCheck class="w-5 h-5 text-primary flex-shrink-0 mt-1" :stroke-width="2" />
                <span><strong>Estimation gratuite</strong> : Aucun engagement de votre part, l'estimation est 100% gratuite.</span>
              </li>
              <li class="flex items-start gap-3">
                <CircleCheck class="w-5 h-5 text-primary flex-shrink-0 mt-1" :stroke-width="2" />
                <span><strong>Prix du marché</strong> : Nos estimations sont basées sur les prix réels du marché, pas sur des prix gonflés.</span>
              </li>
              <li class="flex items-start gap-3">
                <CircleCheck class="w-5 h-5 text-primary flex-shrink-0 mt-1" :stroke-width="2" />
                <span><strong>Accompagnement personnalisé</strong> : Nous restons à votre disposition pour répondre à toutes vos questions.</span>
              </li>
            </ul>
          </div>

          <!-- CTA Section -->
          <div class="bg-primary rounded-md p-8 text-white text-center">
            <h2 class="text-2xl font-bold mb-4">Prêt à faire estimer votre montre ?</h2>
            <p class="text-lg mb-6 opacity-90">
              Remplissez notre formulaire gratuit et recevez une estimation détaillée sous 24-48h.
            </p>
            <RouterLink
              to="/estimation"
              class="inline-flex items-center bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-cream-100 transition-all"
            >
              Faire une estimation gratuite
              <ChevronRight class="w-5 h-5 ml-2" :stroke-width="2" />
            </RouterLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { RouterLink, useRouter } from 'vue-router'
import { ArrowLeft, CheckCircle2, ChevronRight, CircleCheck } from '@lucide/vue'
import { onMounted, ref } from 'vue'
import { getSiteConfig } from '@/site/getSiteConfig.js'

const estimationProcessLead = getSiteConfig().copy.estimationProcessLead

const router = useRouter()
const previousRoute = ref(null)

onMounted(() => {
  // Récupérer la route précédente stockée
  const storedRoute = sessionStorage.getItem('estimationProcessPreviousRoute')
  if (storedRoute) {
    previousRoute.value = storedRoute
    // Nettoyer après récupération
    sessionStorage.removeItem('estimationProcessPreviousRoute')
  }
})

const goBack = () => {
  // Si on vient de la page d'estimation, rediriger explicitement vers /estimation
  if (previousRoute.value === '/estimation') {
    router.push('/estimation')
  } else {
    // Sinon, utiliser l'historique du navigateur
    router.back()
  }
}
</script>


