<script setup>
import { ref, computed } from 'vue'
import { isGooglePlacesEnabled } from '@/services/googlePlaces.js'
import { useAddressAutocomplete } from '@/composables/useAddressAutocomplete.js'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  countries: {
    type: Array,
    default: () => [],
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:modelValue', 'place-selected'])

const containerRef = ref(null)

const autocompleteActive = computed(
  () => isGooglePlacesEnabled() && props.enabled && !props.disabled,
)

useAddressAutocomplete(containerRef, {
  countries: () => props.countries,
  enabled: () => autocompleteActive.value,
  disabled: () => props.disabled,
  modelValue: () => props.modelValue,
  onValueChange(value) {
    emit('update:modelValue', value)
  },
  onPlaceSelected(parsed) {
    if (parsed.line1) {
      emit('update:modelValue', parsed.line1)
    }
    emit('place-selected', parsed)
  },
})

function onInput(event) {
  emit('update:modelValue', event.target.value)
}
</script>

<template>
  <div
    v-if="autocompleteActive"
    ref="containerRef"
    class="watch-place-autocomplete-host"
  />
  <input
    v-else
    :value="modelValue"
    type="text"
    required
    autocomplete="street-address"
    :disabled="disabled"
    class="w-full border border-gray-300 rounded-lg px-3 py-2"
    @input="onInput"
  />
</template>

<style>
.watch-place-autocomplete-host {
  display: block;
  width: 100%;
}

.watch-place-autocomplete {
  display: block;
  width: 100%;
  color-scheme: light;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--color-text-main, #111827);
  background-color: #ffffff;
}

.watch-place-autocomplete:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
