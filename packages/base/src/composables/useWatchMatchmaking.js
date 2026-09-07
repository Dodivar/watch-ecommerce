import { computed, reactive, ref, watch } from 'vue'

import { getAllWatchesForListing } from '@/services/watchService'
import { getActiveCampaignWatchPricingPublic } from '@/services/watchPromotionCampaignService.js'
import { enrichWatchesWithActiveCampaignPricing } from '@/utils/watchPromotionCampaign.js'
import {
  buildMatchFacets,
  createEmptyPreferences,
  rankPool,
  sanitizePreferences,
} from '@/utils/watchMatchmaking.js'
import {
  clearMatchSession,
  createEmptyMatchSession,
  loadMatchSession,
  reconcileMatchSession,
  saveMatchSession,
} from '@/services/matchSessionStorage.js'

/**
 * Machine à états de l'expérience « coup de foudre ».
 *
 * Phases : `loading` → `error` | `empty` | `onboarding` → `swipe` → `end` → `shortlist`.
 * Tout l'état de session vit dans `localStorage` (voir `matchSessionStorage.js`) et n'y
 * conserve que des identifiants : les montres elles-mêmes sont rechargées à chaque visite,
 * puis la session est rapprochée du stock du moment.
 *
 * Le catalogue arrive par pages (`getAllWatchesForListing`, 60 montres puis 300), comme sur la
 * page collection : le parcours s'ouvre sur la première, le reste se range derrière sans que
 * rien n'attende. Le deck a bien besoin de tout connaître pour classer — mais il n'en a besoin
 * qu'au moment de classer, pas pour afficher la première question.
 */
export function useWatchMatchmaking() {
  /** @type {import('vue').Ref<any[]>} */
  const pool = ref([])
  const isLoading = ref(true)
  /** Vrai tant que des pages de catalogue arrivent derrière celle déjà affichée. */
  const isLoadingMore = ref(false)
  const error = ref(null)
  const session = reactive(createEmptyMatchSession())
  /** Coups de cœur d'une visite précédente qui ne sont plus au catalogue. */
  const unavailableLikedIds = ref([])
  let hydrated = false

  const watchById = computed(() => new Map(pool.value.map((w) => [w.id, w])))
  const facets = computed(() => buildMatchFacets(pool.value))
  const activeCriteria = computed(() => facets.value.activeCriteria)

  const ranking = computed(() => rankPool(pool.value, session.preferences))
  const seenSet = computed(() => new Set(session.seen))
  /** Montres restant à présenter, dans l'ordre d'affinité. */
  const deck = computed(() => ranking.value.ranked.filter((w) => !seenSet.value.has(w.id)))
  const currentWatch = computed(() => deck.value[0] ?? null)
  /** Les deux suivantes : montées derrière la carte pour l'empilement et le préchargement. */
  const upcomingWatches = computed(() => deck.value.slice(1, 3))

  const totalInBudget = computed(() => ranking.value.ranked.length)
  const seenInBudget = computed(
    () => ranking.value.ranked.filter((w) => seenSet.value.has(w.id)).length,
  )

  const likedSet = computed(() => new Set(session.liked))
  /** Coups de cœur dans l'ordre où ils ont été donnés ; les disparus gardent leur place. */
  const likedEntries = computed(() =>
    session.liked.map((id) => ({
      id,
      watch: watchById.value.get(id) ?? null,
      unavailable: !watchById.value.has(id),
    })),
  )
  const likedWatches = computed(() => likedEntries.value.map((e) => e.watch).filter(Boolean))

  const phase = computed(() => {
    if (isLoading.value) return 'loading'
    if (error.value) return 'error'
    // Une première page entièrement vendue ne fait pas un catalogue vide : tant que des pages
    // arrivent, on attend plutôt que d'annoncer qu'il n'y a rien à voir.
    if (pool.value.length === 0) return isLoadingMore.value ? 'loading' : 'empty'
    return session.step
  })

  /** Écran de préférences courant, borné aux critères réellement actifs. */
  const currentStepIndex = computed(() =>
    Math.min(session.stepIndex, Math.max(0, activeCriteria.value.length - 1)),
  )

  /* ---------------------------------------------------------------- Chargement */

  async function load() {
    isLoading.value = true
    isLoadingMore.value = true
    error.value = null
    pool.value = []
    unavailableLikedIds.value = []
    hydrated = false
    try {
      // Les deux requêtes partent ensemble ; chaque page attend le tarif promo avant enrichissement.
      const campaignPricing = getActiveCampaignWatchPricingPublic()
      await getAllWatchesForListing({
        onPage: async (page) => {
          const pricing = await campaignPricing
          // Même verdict que la fiche produit : disponible ET non vendue.
          pool.value = pool.value.concat(
            enrichWatchesWithActiveCampaignPricing(page, pricing).filter(
              (w) => w.isAvailable !== false && !w.isSold,
            ),
          )
          if (!hydrated) adoptStoredSession()
          // Le parcours s'ouvre dès qu'il a de quoi montrer ; le reste arrive derrière.
          if (pool.value.length > 0) isLoading.value = false
        },
      })
      // Catalogue vide : aucune page n'est passée, la session n'a pas encore été reprise.
      if (!hydrated) adoptStoredSession()
      settleAgainstPool()
    } catch (err) {
      console.error('Erreur lors du chargement du coup de foudre :', err)
      error.value = err?.message || 'Une erreur est survenue lors du chargement des montres'
    } finally {
      isLoading.value = false
      isLoadingMore.value = false
    }
  }

  /** Reprend la session stockée, sans encore rien conclure du stock. */
  function adoptStoredSession() {
    Object.assign(session, loadMatchSession() ?? createEmptyMatchSession())
    // Le compteur d'écrans est toujours recalculé sur les facettes du jour.
    if (session.step === 'onboarding') {
      session.stepIndex = Math.min(session.stepIndex, Math.max(0, activeCriteria.value.length - 1))
    }
    hydrated = true
  }

  /**
   * Rapproche la session du stock, une fois le catalogue entier chargé. Le rapprochement
   * attend la dernière page : tant qu'elles arrivent, un identifiant absent du pool n'est pas
   * un identifiant disparu — le faire plus tôt remettrait dans le deck des montres déjà vues
   * et annoncerait « plus disponibles » des coups de cœur qui n'ont pas encore été livrés.
   *
   * Ne réécrit que ce qui dépend du stock : les décisions prises pendant le chargement,
   * elles, sont gardées telles quelles.
   */
  function settleAgainstPool() {
    const { session: reconciled, unavailableLikedIds: gone } = reconcileMatchSession(
      session,
      pool.value,
    )
    session.seen = reconciled.seen
    session.passed = reconciled.passed
    unavailableLikedIds.value = gone

    // Deck vidé entre deux visites (montres vendues) : on passe directement à la fin.
    if (session.step === 'swipe' && deck.value.length === 0) {
      session.step = 'end'
    }
    // Nouvelles montres arrivées depuis la fin du parcours : on les présente.
    if (session.step === 'end' && deck.value.length > 0) {
      session.step = 'swipe'
    }
  }

  /* --------------------------------------------------------------- Onboarding */

  /**
   * @param {import('@/utils/watchMatchmaking.js').MatchCriterionId} criterionId
   * @param {unknown} value
   */
  function setPreference(criterionId, value) {
    session.preferences = sanitizePreferences({ ...session.preferences, [criterionId]: value })
  }

  function clearPreference(criterionId) {
    setPreference(criterionId, criterionId === 'budget' ? null : [])
  }

  function goToStep(index) {
    session.stepIndex = Math.max(0, Math.min(index, activeCriteria.value.length - 1))
  }

  function nextStep() {
    if (session.stepIndex >= activeCriteria.value.length - 1) {
      startDiscovery()
      return
    }
    session.stepIndex += 1
  }

  function previousStep() {
    session.stepIndex = Math.max(0, session.stepIndex - 1)
  }

  function startDiscovery() {
    session.step = deck.value.length > 0 ? 'swipe' : 'end'
  }

  /** Retour aux préférences en gardant l'historique : les montres vues restent vues. */
  function editPreferences() {
    session.stepIndex = 0
    session.step = 'onboarding'
  }

  /** Repart de zéro : préférences, historique et coups de cœur. */
  function restart() {
    clearMatchSession()
    Object.assign(session, createEmptyMatchSession())
    unavailableLikedIds.value = []
  }

  /* --------------------------------------------------------------------- Deck */

  function markSeen(watchId) {
    if (!session.seen.includes(watchId)) session.seen = [...session.seen, watchId]
  }

  function like(watchId) {
    if (!watchId) return
    markSeen(watchId)
    session.passed = session.passed.filter((id) => id !== watchId)
    if (!session.liked.includes(watchId)) session.liked = [...session.liked, watchId]
    settleAfterDecision()
  }

  function pass(watchId) {
    if (!watchId) return
    markSeen(watchId)
    session.liked = session.liked.filter((id) => id !== watchId)
    if (!session.passed.includes(watchId)) session.passed = [...session.passed, watchId]
    settleAfterDecision()
  }

  function settleAfterDecision() {
    if (session.step === 'swipe' && deck.value.length === 0) {
      session.step = 'end'
    }
  }

  /* ---------------------------------------------------------------- Shortlist */

  function showShortlist() {
    session.step = 'shortlist'
  }

  function resumeDiscovery() {
    session.step = deck.value.length > 0 ? 'swipe' : 'end'
  }

  function removeLiked(watchId) {
    session.liked = session.liked.filter((id) => id !== watchId)
    unavailableLikedIds.value = unavailableLikedIds.value.filter((id) => id !== watchId)
  }

  /* -------------------------------------------------------------- Persistance */

  watch(
    () => ({
      preferences: session.preferences,
      step: session.step,
      stepIndex: session.stepIndex,
      seen: session.seen,
      liked: session.liked,
      passed: session.passed,
    }),
    (snapshot) => {
      if (!hydrated) return
      saveMatchSession({ ...createEmptyMatchSession(), ...snapshot })
    },
    { deep: true },
  )

  return reactive({
    // état
    pool,
    isLoading,
    isLoadingMore,
    error,
    phase,
    session,
    facets,
    activeCriteria,
    currentStepIndex,
    deck,
    currentWatch,
    upcomingWatches,
    totalInBudget,
    seenInBudget,
    excludedByBudget: computed(() => ranking.value.excludedByBudget),
    likedSet,
    likedEntries,
    likedWatches,
    unavailableLikedIds,
    // actions
    load,
    setPreference,
    clearPreference,
    goToStep,
    nextStep,
    previousStep,
    startDiscovery,
    editPreferences,
    restart,
    like,
    pass,
    showShortlist,
    resumeDiscovery,
    removeLiked,
    // utilitaires
    getWatch: (id) => watchById.value.get(id) ?? null,
    emptyPreferences: createEmptyPreferences,
  })
}
