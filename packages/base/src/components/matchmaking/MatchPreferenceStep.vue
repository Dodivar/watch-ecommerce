<template>
  <fieldset class="min-w-0">
    <legend class="w-full">
      <h2 class="text-xl font-bold text-text-main sm:text-2xl">{{ t(criterion.titleKey) }}</h2>
      <p class="mt-1 text-sm text-gray-600">{{ t(criterion.hintKey) }}</p>
    </legend>

    <!-- Budget : curseur + tranches suggérées + saisie fine -->
    <div v-if="criterion.control === 'slider'" class="mt-5 sm:mt-6">
      <div
        v-if="facet.suggestions.length"
        class="flex flex-wrap gap-2"
        role="group"
        :aria-label="t(criterion.titleKey)"
      >
        <button
          v-for="(range, index) in facet.suggestions"
          :key="`${range.min}-${range.max}`"
          type="button"
          :class="chipClass(isSuggestionActive(range))"
          :aria-pressed="isSuggestionActive(range)"
          @click="applySuggestion(range)"
        >
          {{ suggestionLabel(range, index) }}
        </button>
      </div>

      <div class="matchmaking-slider mt-6 px-3 pt-8 sm:mt-8 sm:px-4">
        <Slider
          v-model="sliderRange"
          :min="facet.min"
          :max="facet.max"
          :step="50"
          :tooltips="true"
          :merge="tooltipMergeDistance"
          :format="sliderFormat"
          class="w-full max-w-full min-w-0"
        />
        <div class="mt-2 flex justify-between text-xs text-gray-500">
          <span>{{ formatPrice(facet.min) }}</span>
          <span>{{ formatPrice(facet.max) }}</span>
        </div>
      </div>

      <div class="mt-4 grid grid-cols-2 gap-3 sm:mt-5">
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-gray-600">
            {{ t('matchmaking.step.budget.min') }}
          </span>
          <input
            v-model.number="minInput"
            type="number"
            inputmode="numeric"
            :min="facet.min"
            :max="facet.max"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary"
            @blur="commitInputs"
            @keydown.enter.prevent="commitInputs"
          />
        </label>
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-gray-600">
            {{ t('matchmaking.step.budget.max') }}
          </span>
          <input
            v-model.number="maxInput"
            type="number"
            inputmode="numeric"
            :min="facet.min"
            :max="facet.max"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary"
            @blur="commitInputs"
            @keydown.enter.prevent="commitInputs"
          />
        </label>
      </div>
    </div>

    <!-- Pastilles de couleur -->
    <div
      v-else-if="criterion.control === 'swatches'"
      class="mt-5 flex flex-wrap gap-4 sm:mt-6"
      role="group"
      :aria-label="t(criterion.titleKey)"
    >
      <button
        v-for="option in facet.options"
        :key="option.value"
        type="button"
        class="flex flex-col items-center gap-2 focus:outline-none"
        :aria-pressed="isSelected(option.value)"
        :title="optionLabel(option)"
        @click="toggle(option.value)"
      >
        <span
          class="flex h-12 w-12 items-center justify-center rounded-full ring-offset-2 transition-all"
          :class="
            isSelected(option.value)
              ? 'ring-2 ring-primary'
              : 'ring-1 ring-gray-300 hover:ring-gray-400'
          "
        >
          <span
            class="relative block h-10 w-10 rounded-full shadow-inner"
            :style="{ backgroundImage: option.gradient }"
          >
            <Check
              v-if="isSelected(option.value)"
              class="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow"
              :stroke-width="3"
            />
          </span>
        </span>
        <span class="text-xs font-medium text-gray-700">{{ optionLabel(option) }}</span>
      </button>
    </div>

    <!-- Puces -->
    <div
      v-else
      class="mt-5 flex flex-wrap gap-2 sm:mt-6"
      role="group"
      :aria-label="t(criterion.titleKey)"
    >
      <button
        v-for="option in facet.options"
        :key="option.value"
        type="button"
        :class="chipClass(isSelected(option.value))"
        :aria-pressed="isSelected(option.value)"
        @click="toggle(option.value)"
      >
        {{ optionLabel(option) }}
      </button>
    </div>
  </fieldset>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { Check } from '@lucide/vue'
import Slider from '@vueform/slider'
import '@vueform/slider/themes/default.css'

import { t } from '@/i18n'
import { formatPrice } from '@/utils/formatters.js'

const props = defineProps({
  /** Descripteur de `MATCH_CRITERIA`. */
  criterion: { type: Object, required: true },
  /** Facette correspondante de `buildMatchFacets()`. */
  facet: { type: Object, required: true },
  /** `{ min, max } | null` pour le budget, `string[]` sinon. */
  modelValue: { type: [Object, Array, null], default: null },
})

const emit = defineEmits(['update:modelValue'])

const sliderFormat = { suffix: ' €', decimals: 0, thousand: ' ' }

/** Deux poignées rapprochées fusionnent leur info-bulle (« 3 000 € – 5 600 € ») au lieu de se chevaucher. */
const tooltipMergeDistance = computed(() =>
  Math.max(50, Math.round((props.facet.max - props.facet.min) * 0.12)),
)

/* ------------------------------------------------------------------ Budget */

function currentRange() {
  const budget = props.modelValue && !Array.isArray(props.modelValue) ? props.modelValue : null
  const min = Math.max(props.facet.min, Math.min(props.facet.max, budget?.min ?? props.facet.min))
  const max = Math.max(min, Math.min(props.facet.max, budget?.max ?? props.facet.max))
  return [min, max]
}

const minInput = ref(currentRange()[0])
const maxInput = ref(currentRange()[1])

const sliderRange = computed({
  get: () => currentRange(),
  set: ([min, max]) => emitBudget(min, max),
})

watch(
  () => props.modelValue,
  () => {
    const [min, max] = currentRange()
    minInput.value = min
    maxInput.value = max
  },
  { deep: true },
)

function emitBudget(min, max) {
  const lo = Math.max(props.facet.min, Math.min(props.facet.max, Number(min)))
  const hi = Math.max(lo, Math.min(props.facet.max, Number(max)))
  // Bornes ramenées au pool entier = pas de préférence : on n'enregistre rien.
  if (lo <= props.facet.min && hi >= props.facet.max) {
    emit('update:modelValue', null)
    return
  }
  emit('update:modelValue', { min: lo, max: hi })
}

function commitInputs() {
  let lo = Number.isFinite(minInput.value) ? minInput.value : props.facet.min
  let hi = Number.isFinite(maxInput.value) ? maxInput.value : props.facet.max
  if (lo > hi) [lo, hi] = [hi, lo]
  emitBudget(lo, hi)
}

function applySuggestion(range) {
  if (isSuggestionActive(range)) {
    emit('update:modelValue', null)
    return
  }
  emitBudget(range.min, range.max)
}

function isSuggestionActive(range) {
  const [min, max] = currentRange()
  return props.modelValue && min === range.min && max === range.max
}

function suggestionLabel(range, index) {
  const last = props.facet.suggestions.length - 1
  if (index === 0) return t('matchmaking.step.budget.upTo', { max: formatPrice(range.max) })
  if (index === last) return t('matchmaking.step.budget.from', { min: formatPrice(range.min) })
  return t('matchmaking.step.budget.between', {
    min: formatPrice(range.min),
    max: formatPrice(range.max),
  })
}

/* ------------------------------------------------------------ Multi-choix */

const selected = computed(() => (Array.isArray(props.modelValue) ? props.modelValue : []))

function isSelected(value) {
  return selected.value.includes(value)
}

function toggle(value) {
  const next = isSelected(value)
    ? selected.value.filter((v) => v !== value)
    : [...selected.value, value]
  emit('update:modelValue', next)
}

function optionLabel(option) {
  if (option.label) return option.label
  return option.labelKey ? t(option.labelKey) : option.value
}

function chipClass(active) {
  return [
    'rounded-md border px-3 py-2 text-left text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
    active
      ? 'border-primary bg-primary text-white'
      : 'border-gray-300 bg-white text-text-main hover:border-primary',
  ]
}
</script>

<style scoped>
.matchmaking-slider {
  --slider-tooltip-font-size: 0.75rem;
  --slider-tooltip-line-height: 1.125rem;
  --slider-tooltip-px: 4px;
  --slider-tooltip-py: 2px;
}

:deep(.slider-connect) {
  background: var(--color-primary, #0f2a1d);
}

:deep(.slider-handle) {
  background: var(--color-primary, #0f2a1d);
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

:deep(.slider-handle:hover) {
  background: var(--color-primary-hover, #163d2a);
}

:deep(.slider-tooltip) {
  background: var(--color-primary, #0f2a1d);
  border: 1px solid var(--color-primary, #0f2a1d);
  color: white;
}

:deep(.slider-horizontal .slider-tooltip-top::before) {
  border-top-color: var(--color-primary, #0f2a1d);
}
</style>
