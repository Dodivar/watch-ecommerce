<script setup>

import { ref, computed, onMounted } from 'vue'

import { useRouter } from 'vue-router'

import { getPromoCodesForAdmin, deletePromoCode } from '@/services/admin/adminPromoService'

import AdminShell from './AdminShell.vue'



const router = useRouter()

const promos = ref([])

const isLoading = ref(true)

const error = ref(null)

function formatPromoDate(iso) {

  if (!iso) return '—'

  return new Date(iso).toLocaleDateString('fr-FR', {

    day: '2-digit',

    month: '2-digit',

    year: 'numeric',

  })

}



function formatDiscount(promo) {

  if (promo.discountType === 'free_shipping') return 'Livraison offerte'

  if (promo.discountType === 'percent') return `${promo.discountValue} %`

  return `${promo.discountValue} €`

}



function isPromoPast(promo) {

  if (!promo.endsAt) return false

  return new Date(promo.endsAt) < new Date()

}



function isPromoUpcoming(promo) {

  if (isPromoPast(promo)) return false

  if (!promo.startsAt) return false

  return new Date(promo.startsAt) > new Date()

}



const currentPromos = computed(() => promos.value.filter((p) => !isPromoPast(p)))

const pastPromos = computed(() => promos.value.filter((p) => isPromoPast(p)))



async function load() {

  try {

    isLoading.value = true

    promos.value = await getPromoCodesForAdmin()

  } catch (err) {

    error.value = err.message

  } finally {

    isLoading.value = false

  }

}



async function remove(id) {

  if (!confirm('Supprimer ce code promo ?')) return

  try {

    error.value = null

    await deletePromoCode(id)

  } catch (err) {

    error.value = err.message || 'Erreur lors de la suppression'

  }

  await load()

}



onMounted(load)

</script>



<template>

  <AdminShell title="Codes promo" content-class="max-w-4xl">

      <div class="mb-4">

        <button type="button" class="px-4 py-2 bg-primary text-white rounded-lg" @click="router.push('/admin/promo/new')">Nouveau code</button>

      </div>

      <div v-if="error" class="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4">{{ error }}</div>

      <div v-if="isLoading" class="text-center py-12">Chargement…</div>

      <template v-else>

        <section class="mb-8">

          <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">

            En cours

            <span class="font-normal normal-case">({{ currentPromos.length }})</span>

          </h2>

          <div class="bg-white rounded-lg shadow divide-y">

            <div v-for="p in currentPromos" :key="p.id" class="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">

              <div class="min-w-0">

                <div class="flex flex-wrap items-center gap-2">

                  <span class="font-mono font-semibold">{{ p.code }}</span>

                  <span class="text-sm text-gray-500">{{ formatDiscount(p) }}</span>

                  <span v-if="!p.active" class="text-xs px-2 py-0.5 rounded bg-red-50 text-red-600">Inactif</span>

                  <span v-else-if="isPromoUpcoming(p)" class="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700">À venir</span>

                </div>

                <p class="text-sm text-gray-500 mt-1">

                  {{ formatPromoDate(p.startsAt) }} → {{ formatPromoDate(p.endsAt) }}

                  <span v-if="p.maxUses != null" class="text-gray-400"> · {{ p.usedCount }}/{{ p.maxUses }} util.</span>

                </p>

              </div>

              <div class="flex shrink-0 gap-3">

                <button type="button" class="text-primary underline" @click="router.push(`/admin/promo/${p.id}/edit`)">Modifier</button>

                <button type="button" class="text-red-600 underline" @click="remove(p.id)">Supprimer</button>

              </div>

            </div>

            <div v-if="currentPromos.length === 0" class="p-8 text-center text-gray-500">Aucun code en cours.</div>

          </div>

        </section>



        <section>

          <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">

            Passés

            <span class="font-normal normal-case">({{ pastPromos.length }})</span>

          </h2>

          <div class="bg-white rounded-lg shadow divide-y">

            <div v-for="p in pastPromos" :key="p.id" class="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 opacity-80">

              <div class="min-w-0">

                <div class="flex flex-wrap items-center gap-2">

                  <span class="font-mono font-semibold text-gray-700">{{ p.code }}</span>

                  <span class="text-sm text-gray-400">{{ formatDiscount(p) }}</span>

                </div>

                <p class="text-sm text-gray-400 mt-1">

                  {{ formatPromoDate(p.startsAt) }} → {{ formatPromoDate(p.endsAt) }}

                  <span v-if="p.maxUses != null"> · {{ p.usedCount }}/{{ p.maxUses }} util.</span>

                </p>

              </div>

              <div class="flex shrink-0 gap-3">

                <button type="button" class="text-primary underline" @click="router.push(`/admin/promo/${p.id}/edit`)">Modifier</button>

                <button type="button" class="text-red-600 underline" @click="remove(p.id)">Supprimer</button>

              </div>

            </div>

            <div v-if="pastPromos.length === 0" class="p-8 text-center text-gray-500">Aucun code passé.</div>

          </div>

        </section>

      </template>

  </AdminShell>

</template>

