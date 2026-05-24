<script setup>

import { ref, computed } from 'vue'

import { isGooglePlacesEnabled } from '@/services/googleMaps.js'

import { useAddressAutocomplete } from '@/composables/useAddressAutocomplete.js'

import { CHECKOUT_FIELD_CLASS } from './checkoutFieldClasses.js'



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

  placeholder: {

    type: String,

    default: '',

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

  placeholder: () => props.placeholder,

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

    :placeholder="placeholder"

    :class="CHECKOUT_FIELD_CLASS"

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

  box-sizing: border-box;

  color-scheme: light;

  border: 1px solid #d1d5db;

  border-radius: var(--radius-lg);

  font-family: inherit;

  font-size: 1rem;

  line-height: 1.5;

  color: #111827;

  background-color: #ffffff;

}



.watch-place-autocomplete::part(input) {

  padding: 0.5rem 0.75rem;

  font-family: inherit;

  font-size: 1rem;

  line-height: 1.5;

  color: #111827;

}



.watch-place-autocomplete::part(input)::placeholder {

  color: #9ca3af;

}



.watch-place-autocomplete:disabled {

  opacity: 0.6;

  cursor: not-allowed;

}

</style>

