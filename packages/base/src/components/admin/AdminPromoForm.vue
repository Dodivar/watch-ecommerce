<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import { fr } from 'date-fns/locale'
import '@vuepic/vue-datepicker/dist/main.css'
import { getPromoCodeByIdForAdmin, createPromoCode, updatePromoCode } from '@/services/admin/adminPromoService'
import AdminShell from './AdminShell.vue'

const datePickerFormats = { input: 'dd/MM/yyyy HH:mm' }
const datePickerTimeConfig = { enableTimePicker: true, is24: true }

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
  let promo
  try {
    promo = await getPromoCodeByIdForAdmin(route.params.id)
  } catch (err) {
    error.value = err.message || 'Erreur lors du chargement du code promo'
    return
  }
  if (!promo) {
    error.value = 'Code introuvable'
    return
  }
  form.value = {
    code: promo.code,
    active: promo.active,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    startsAt: promo.startsAt || '',
    endsAt: promo.endsAt || '',
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
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label for="promo-starts-at" class="block text-sm mb-1">Début</label>
            <div class="promo-date-picker">
              <VueDatePicker
                v-model="form.startsAt"
                model-type="iso"
                :locale="fr"
                :formats="datePickerFormats"
                :time-config="datePickerTimeConfig"
                :input-attrs="{ id: 'promo-starts-at', autocomplete: 'off' }"
                placeholder="jj/mm/aaaa hh:mm"
                :week-start="1"
                auto-apply
                clearable
                teleport="body"
              />
            </div>
          </div>
          <div>
            <label for="promo-ends-at" class="block text-sm mb-1">Fin</label>
            <div class="promo-date-picker">
              <VueDatePicker
                v-model="form.endsAt"
                model-type="iso"
                :locale="fr"
                :formats="datePickerFormats"
                :time-config="datePickerTimeConfig"
                :input-attrs="{ id: 'promo-ends-at', autocomplete: 'off' }"
                placeholder="jj/mm/aaaa hh:mm"
                :week-start="1"
                auto-apply
                clearable
                teleport="body"
              />
            </div>
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

<style scoped>
.promo-date-picker {
  --dp-primary-color: var(--color-primary);
  --dp-primary-disabled-color: color-mix(in srgb, var(--color-primary) 45%, white);
  --dp-border-color-focus: var(--color-primary);
  --dp-font-family: inherit;
}

.promo-date-picker :deep(.dp__input) {
  border-color: #d1d5db;
  border-radius: 0.5rem;
  color: #111827;
  font-size: 0.875rem;
  line-height: 1.25rem;
  padding: 0.5rem 0.75rem;
}

.promo-date-picker :deep(.dp__input:hover:not(.dp__input_focus)) {
  border-color: color-mix(in srgb, var(--color-primary) 40%, #d1d5db);
}

.promo-date-picker :deep(.dp__input_focus) {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 40%, transparent);
}
</style>
