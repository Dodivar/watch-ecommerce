<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPromoCodeByIdForAdmin, createPromoCode, updatePromoCode } from '@/services/admin/adminPromoService'
import AdminShell from './AdminShell.vue'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id && route.params.id !== 'new')

const form = ref({
  code: '',
  active: true,
  discountType: 'percent',
  discountValue: 10,
  startsAt: '',
  endsAt: '',
  maxUses: '',
})
const isLoading = ref(false)
const error = ref(null)

async function load() {
  if (!isEdit.value) return
  const promo = await getPromoCodeByIdForAdmin(route.params.id)
  if (!promo) {
    error.value = 'Code introuvable'
    return
  }
  form.value = {
    code: promo.code,
    active: promo.active,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    startsAt: promo.startsAt ? promo.startsAt.slice(0, 16) : '',
    endsAt: promo.endsAt ? promo.endsAt.slice(0, 16) : '',
    maxUses: promo.maxUses ?? '',
  }
}

async function save() {
  try {
    isLoading.value = true
    error.value = null
    const payload = {
      ...form.value,
      maxUses: form.value.maxUses === '' ? null : Number(form.value.maxUses),
      startsAt: form.value.startsAt || null,
      endsAt: form.value.endsAt || null,
    }
    if (isEdit.value) await updatePromoCode(route.params.id, payload)
    else await createPromoCode(payload)
    router.push('/admin/promo')
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

onMounted(load)
</script>

<template>
  <AdminShell
    :title="isEdit ? 'Modifier promo' : 'Nouveau code promo'"
    show-back-button
    back-button-route="/admin/promo"
    content-class="max-w-lg"
  >
      <div v-if="error" class="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4">{{ error }}</div>
      <form class="bg-white rounded-lg shadow p-6 space-y-4" @submit.prevent="save">
        <div>
          <label class="block text-sm font-medium mb-1">Code</label>
          <input v-model="form.code" required class="w-full px-3 py-2 border rounded-lg uppercase" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Type</label>
          <select v-model="form.discountType" class="w-full px-3 py-2 border rounded-lg">
            <option value="percent">Pourcentage</option>
            <option value="fixed">Montant fixe (€)</option>
            <option value="free_shipping">Livraison offerte</option>
          </select>
        </div>
        <div v-if="form.discountType !== 'free_shipping'">
          <label class="block text-sm font-medium mb-1">Valeur</label>
          <input v-model.number="form.discountValue" type="number" min="0" step="0.01" class="w-full px-3 py-2 border rounded-lg" />
        </div>
        <label class="flex items-center gap-2"><input v-model="form.active" type="checkbox" /> Actif</label>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm mb-1">Début</label>
            <input v-model="form.startsAt" type="datetime-local" class="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label class="block text-sm mb-1">Fin</label>
            <input v-model="form.endsAt" type="datetime-local" class="w-full px-3 py-2 border rounded-lg" />
          </div>
        </div>
        <div>
          <label class="block text-sm mb-1">Utilisations max (vide = illimité)</label>
          <input v-model="form.maxUses" type="number" min="1" class="w-full px-3 py-2 border rounded-lg" />
        </div>
        <button type="submit" class="w-full py-2 bg-primary text-white rounded-lg" :disabled="isLoading">{{ isLoading ? 'Enregistrement…' : 'Enregistrer' }}</button>
      </form>
  </AdminShell>
</template>
