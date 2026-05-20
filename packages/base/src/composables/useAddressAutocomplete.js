import { unref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { ensureGooglePlaces, isGooglePlacesEnabled } from '@/services/googleMaps.js'
import { parseAddressComponents } from '@/utils/parseGoogleAddressComponents.js'

const ADDRESS_PRIMARY_TYPES = ['street_address', 'premise', 'subpremise', 'route']

/**
 * Attache Google PlaceAutocompleteElement à un conteneur adresse.
 * @param {import('vue').Ref<HTMLElement | null>} containerRef
 * @param {{
 *   countries: import('vue').MaybeRefOrGetter<string[]>,
 *   enabled?: import('vue').MaybeRefOrGetter<boolean>,
 *   modelValue?: import('vue').MaybeRefOrGetter<string>,
 *   disabled?: import('vue').MaybeRefOrGetter<boolean>,
 *   placeholder?: import('vue').MaybeRefOrGetter<string>,
 *   onValueChange?: (value: string) => void,
 *   onPlaceSelected: (parsed: ReturnType<typeof parseAddressComponents>) => void,
 * }} options
 */
export function useAddressAutocomplete(containerRef, options) {
  const { onPlaceSelected, onValueChange } = options
  /** @type {google.maps.places.PlaceAutocompleteElement | null} */
  let autocompleteElement = null
  /** @type {((event: google.maps.places.PlacePredictionSelectEvent) => void) | null} */
  let selectHandler = null
  /** @type {(() => void) | null} */
  let inputHandler = null

  function resolveCountries() {
    const raw =
      typeof options.countries === 'function' ? options.countries() : unref(options.countries)
    if (!Array.isArray(raw) || raw.length === 0) {
      return ['fr']
    }
    return raw.map((c) => String(c).trim().toLowerCase()).filter(Boolean).slice(0, 15)
  }

  function isEnabled() {
    if (!isGooglePlacesEnabled()) return false
    const flag =
      typeof options.enabled === 'function' ? options.enabled() : unref(options.enabled)
    return flag !== false
  }

  function resolveModelValue() {
    if (options.modelValue == null) return ''
    return typeof options.modelValue === 'function'
      ? options.modelValue()
      : String(unref(options.modelValue) || '')
  }

  function isDisabled() {
    const flag =
      typeof options.disabled === 'function' ? options.disabled() : unref(options.disabled)
    return Boolean(flag)
  }

  function resolvePlaceholder() {
    if (options.placeholder == null) return ''
    return typeof options.placeholder === 'function'
      ? options.placeholder()
      : String(unref(options.placeholder) || '')
  }

  function syncElementState() {
    if (!autocompleteElement) return
    const next = resolveModelValue()
    if (autocompleteElement.value !== next) {
      autocompleteElement.value = next
    }
    autocompleteElement.disabled = isDisabled()
    const placeholder = resolvePlaceholder()
    if (placeholder && autocompleteElement.placeholder !== placeholder) {
      autocompleteElement.placeholder = placeholder
    }
  }

  async function onGmpSelect(event) {
    const placePrediction = event?.placePrediction
    if (!placePrediction) return

    const place = placePrediction.toPlace()
    await place.fetchFields({
      fields: ['addressComponents', 'formattedAddress'],
    })

    if (!place.addressComponents?.length) return

    const parsed = parseAddressComponents(place.addressComponents, {
      formattedAddress: place.formattedAddress,
    })
    if (parsed.line1 || parsed.city || parsed.postalCode) {
      onPlaceSelected(parsed)
    }
  }

  function applyCountryRestrictions() {
    if (!autocompleteElement) return
    autocompleteElement.includedRegionCodes = resolveCountries()
  }

  function destroy() {
    if (autocompleteElement && selectHandler) {
      autocompleteElement.removeEventListener('gmp-select', selectHandler)
    }
    if (autocompleteElement && inputHandler) {
      autocompleteElement.removeEventListener('input', inputHandler)
    }
    autocompleteElement?.remove()
    autocompleteElement = null
    selectHandler = null
    inputHandler = null
  }

  async function init() {
    if (!isEnabled()) {
      destroy()
      return
    }

    const container = unref(containerRef)
    if (!container) return

    const places = await ensureGooglePlaces()
    if (!places?.PlaceAutocompleteElement) return

    destroy()

    autocompleteElement = new places.PlaceAutocompleteElement({
      includedRegionCodes: resolveCountries(),
      includedPrimaryTypes: ADDRESS_PRIMARY_TYPES,
      name: 'street-address',
      value: resolveModelValue(),
      disabled: isDisabled(),
      placeholder: resolvePlaceholder(),
      requestedLanguage: 'fr',
      noInputIcon: true,
    })
    autocompleteElement.className = 'watch-place-autocomplete'

    selectHandler = (event) => {
      void onGmpSelect(event)
    }
    inputHandler = () => {
      onValueChange?.(autocompleteElement?.value || '')
    }

    autocompleteElement.addEventListener('gmp-select', selectHandler)
    autocompleteElement.addEventListener('input', inputHandler)
    container.appendChild(autocompleteElement)
  }

  watch(
    () => resolveCountries().join(','),
    async () => {
      if (autocompleteElement) {
        applyCountryRestrictions()
      } else if (isEnabled()) {
        await nextTick()
        init()
      }
    },
  )

  watch(
    () => isEnabled(),
    async (active) => {
      if (active) {
        await nextTick()
        init()
      } else {
        destroy()
      }
    },
  )

  watch(
    () => [resolveModelValue(), isDisabled(), resolvePlaceholder()].join('\0'),
    () => {
      syncElementState()
    },
  )

  onMounted(async () => {
    await nextTick()
    init()
  })

  onUnmounted(() => {
    destroy()
  })

  return { reinit: init, destroy }
}
