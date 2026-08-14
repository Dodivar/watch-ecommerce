<script setup>
import { ref, watch } from 'vue'
import Slider from '@vueform/slider'
import '@vueform/slider/themes/default.css'

const props = defineProps({
  min: { type: Number, default: 0 },
  max: { type: Number, default: 15000 },
  modelValue: { type: Array, default: () => [0, 15000] },
})
const emit = defineEmits(['update:modelValue'])

const range = ref([...props.modelValue])
// Temporary values for input fields (to allow typing without updating slider immediately)
const tempMin = ref(range.value[0])
const tempMax = ref(range.value[1])

watch(
  () => props.modelValue,
  (val) => {
    if (val[0] !== range.value[0] || val[1] !== range.value[1]) {
      range.value = [...val]
      tempMin.value = val[0]
      tempMax.value = val[1]
    }
  },
)

watch(range, (val) => {
  emit('update:modelValue', val)
  // Sync temp values when range changes (from slider)
  tempMin.value = val[0]
  tempMax.value = val[1]
})

const updateRangeFromInput = () => {
  // Update range from temp values
  let newMin = tempMin.value
  let newMax = tempMax.value
  
  // Round to nearest hundred (since slider step is 100)
  newMin = Math.round(newMin / 100) * 100
  newMax = Math.round(newMax / 100) * 100
  
  // Ensure min <= max
  if (newMin > newMax) {
    newMin = newMax
    tempMin.value = newMin
  }
  // Clamp values
  newMin = Math.max(props.min, Math.min(props.max, newMin))
  newMax = Math.max(props.min, Math.min(props.max, newMax))
  
  // Update range (which will trigger the watcher and emit)
  range.value = [newMin, newMax]
  // Sync temp values in case they were clamped
  tempMin.value = newMin
  tempMax.value = newMax
}
</script>

<template>
  <div class="w-full flex flex-col">
    <!-- Price Slider -->
    <div class="mb-4 mx-2">
      <div class="mb-4">
        <Slider
          v-model="range"
          :min="min"
          :max="max"
          :step="100"
          :tooltips="true"
          :format="{ suffix: ' €', decimals: 0, thousand: ' ' }"
          class="w-full"
        />
      </div>
      <div class="flex justify-between text-xs text-subtle">
        <span>{{ min.toLocaleString() }} €</span>
        <span>{{ max.toLocaleString() }} €</span>
      </div>
    </div>

    <!-- Manual Input Fields -->
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-text-main mb-2">Budget minimum</label>
        <div class="relative">
          <input
            v-model.number="tempMin"
            type="number"
            :min="min"
            :max="max"
            class="w-full px-4 py-2 border border-border-strong rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            @blur="updateRangeFromInput"
          />
          <span class="absolute right-3 top-1/2 transform -translate-y-1/2 text-subtle">€</span>
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-text-main mb-2">Budget maximum</label>
        <div class="relative">
          <input
            v-model.number="tempMax"
            type="number"
            :min="min"
            :max="max"
            class="w-full px-4 py-2 border border-border-strong rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            @blur="updateRangeFromInput"
          />
          <span class="absolute right-3 top-1/2 transform -translate-y-1/2 text-subtle">€</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Responsive: le slider prend toute la largeur sur mobile */
@media (max-width: 640px) {
  .w-full {
    min-width: 0;
    width: 100% !important;
  }
}

/* Custom slider styles */
:deep(.slider-connect) {
  background: #0f2a1d;
}

:deep(.slider-handle) {
  background: #0f2a1d;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

:deep(.slider-handle:hover) {
  background: #163d2a;
}

:deep(.slider-tooltip) {
  background: #0f2a1d;
  border: none;
  color: white;
}

:deep(.slider-tooltip::before) {
  border-top-color: #0f2a1d;
}
</style>
