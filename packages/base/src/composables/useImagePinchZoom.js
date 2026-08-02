import { computed, ref } from 'vue'

const MIN_SCALE = 1
const DEFAULT_MAX_SCALE = 4
const DOUBLE_TAP_SCALE = 2.5

/** Marge d'élasticité autorisée au-delà des bornes pendant le geste. */
const SCALE_OVERSHOOT_RATIO = 0.25
const PAN_OVERSHOOT_RATIO = 0.4

const SETTLE_MS = 220
const DOUBLE_TAP_MAX_DELAY_MS = 300
const DOUBLE_TAP_MAX_MOVE_PX = 24
const TAP_MAX_DURATION_MS = 250

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function touchDistance(a, b) {
  return Math.max(Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), 1)
}

function touchMidpoint(a, b) {
  return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 }
}

/**
 * Applique une résistance progressive au-delà de `limit` au lieu de bloquer net.
 */
function rubberBand(value, limit) {
  if (Math.abs(value) <= limit) return value
  const overshoot = Math.abs(value) - limit
  return Math.sign(value) * (limit + overshoot * PAN_OVERSHOOT_RATIO)
}

/**
 * Zoom pincement / double-tap sur une image affichée en `object-contain`.
 *
 * Le point sous les doigts reste fixe pendant le zoom : la translation est
 * recalculée à partir de l'ancre du geste plutôt que du centre du conteneur.
 *
 * @param {object} options
 * @param {import('vue').Ref<HTMLElement | null>} options.containerRef
 * @param {import('vue').Ref<HTMLImageElement | null>} options.imageRef
 * @param {number} [options.maxScale]
 */
export function useImagePinchZoom({
  containerRef,
  imageRef,
  maxScale = DEFAULT_MAX_SCALE,
} = {}) {
  const scale = ref(MIN_SCALE)
  const translateX = ref(0)
  const translateY = ref(0)
  const transitionMs = ref(0)

  const isZoomed = computed(() => scale.value > MIN_SCALE + 0.01)

  const transformStyle = computed(() => ({
    transform: `translate3d(${translateX.value}px, ${translateY.value}px, 0) scale(${scale.value})`,
    transition: transitionMs.value > 0 ? `transform ${transitionMs.value}ms ease-out` : 'none',
    willChange: 'transform',
  }))

  let gesture = null
  let pinchStart = null
  let panStart = null
  let tapCandidate = null
  let lastTap = null

  /**
   * Taille réellement peinte par `object-contain`, qui conditionne les bornes
   * de déplacement : l'élément <img> est souvent plus grand que l'image visible.
   */
  function paintedSize() {
    const container = containerRef?.value
    if (!container) return null

    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight
    const naturalWidth = imageRef?.value?.naturalWidth || 0
    const naturalHeight = imageRef?.value?.naturalHeight || 0

    if (!naturalWidth || !naturalHeight) {
      return { width: containerWidth, height: containerHeight, containerWidth, containerHeight }
    }

    const ratio = Math.min(containerWidth / naturalWidth, containerHeight / naturalHeight)
    return {
      width: naturalWidth * ratio,
      height: naturalHeight * ratio,
      containerWidth,
      containerHeight,
    }
  }

  function panBounds(atScale) {
    const size = paintedSize()
    if (!size) return { maxX: 0, maxY: 0 }

    return {
      maxX: Math.max(0, (size.width * atScale - size.containerWidth) / 2),
      maxY: Math.max(0, (size.height * atScale - size.containerHeight) / 2),
    }
  }

  function containerCenter() {
    const rect = containerRef?.value?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
  }

  function zoomAround(nextScale, anchor, from) {
    const center = containerCenter()
    const ratio = nextScale / from.scale

    translateX.value = anchor.x - center.x - ratio * (from.anchor.x - center.x - from.translateX)
    translateY.value = anchor.y - center.y - ratio * (from.anchor.y - center.y - from.translateY)
    scale.value = nextScale
  }

  /** Ramène l'échelle et la translation dans les bornes, avec animation. */
  function settle() {
    const target = clamp(scale.value, MIN_SCALE, maxScale)
    const ratio = scale.value > 0 ? target / scale.value : 1
    const bounds = panBounds(target)

    transitionMs.value = SETTLE_MS
    scale.value = target
    translateX.value = clamp(translateX.value * ratio, -bounds.maxX, bounds.maxX)
    translateY.value = clamp(translateY.value * ratio, -bounds.maxY, bounds.maxY)
  }

  function reset({ animate = false } = {}) {
    transitionMs.value = animate ? SETTLE_MS : 0
    scale.value = MIN_SCALE
    translateX.value = 0
    translateY.value = 0
    gesture = null
    pinchStart = null
    panStart = null
    tapCandidate = null
    lastTap = null
  }

  function toggleZoomAt(anchor) {
    const from = {
      scale: scale.value,
      translateX: translateX.value,
      translateY: translateY.value,
      anchor,
    }

    transitionMs.value = SETTLE_MS

    if (isZoomed.value) {
      scale.value = MIN_SCALE
      translateX.value = 0
      translateY.value = 0
      return
    }

    zoomAround(Math.min(DOUBLE_TAP_SCALE, maxScale), anchor, from)

    const bounds = panBounds(scale.value)
    translateX.value = clamp(translateX.value, -bounds.maxX, bounds.maxX)
    translateY.value = clamp(translateY.value, -bounds.maxY, bounds.maxY)
  }

  function beginPinch(event) {
    const [first, second] = event.touches
    gesture = 'pinch'
    tapCandidate = null
    pinchStart = {
      distance: touchDistance(first, second),
      scale: scale.value,
      translateX: translateX.value,
      translateY: translateY.value,
      anchor: touchMidpoint(first, second),
    }
  }

  function beginPan(touch) {
    gesture = 'pan'
    panStart = {
      x: touch.clientX,
      y: touch.clientY,
      translateX: translateX.value,
      translateY: translateY.value,
    }
  }

  function onTouchStart(event) {
    transitionMs.value = 0

    if (event.touches.length >= 2) {
      event.preventDefault()
      event.stopPropagation()
      beginPinch(event)
      return
    }

    const touch = event.touches[0]
    if (!touch) return

    tapCandidate = { x: touch.clientX, y: touch.clientY, time: performance.now() }

    // Tant que l'image n'est pas zoomée, le glissement horizontal doit remonter
    // au carrousel pour changer de photo.
    if (isZoomed.value) {
      event.stopPropagation()
      beginPan(touch)
    }
  }

  function onTouchMove(event) {
    if (gesture === 'pinch' && event.touches.length >= 2) {
      event.preventDefault()
      event.stopPropagation()

      const [first, second] = event.touches
      const rawScale = pinchStart.scale * (touchDistance(first, second) / pinchStart.distance)
      const bounded = clamp(
        rawScale,
        MIN_SCALE * (1 - SCALE_OVERSHOOT_RATIO),
        maxScale * (1 + SCALE_OVERSHOOT_RATIO),
      )

      zoomAround(bounded, touchMidpoint(first, second), pinchStart)
      return
    }

    const touch = event.touches[0]
    if (!touch) return

    if (
      tapCandidate &&
      Math.hypot(touch.clientX - tapCandidate.x, touch.clientY - tapCandidate.y) >
        DOUBLE_TAP_MAX_MOVE_PX
    ) {
      tapCandidate = null
    }

    if (gesture !== 'pan') return

    event.preventDefault()
    event.stopPropagation()

    const bounds = panBounds(scale.value)
    translateX.value = rubberBand(panStart.translateX + (touch.clientX - panStart.x), bounds.maxX)
    translateY.value = rubberBand(panStart.translateY + (touch.clientY - panStart.y), bounds.maxY)
  }

  function detectDoubleTap() {
    if (!tapCandidate) return false

    const now = performance.now()
    if (now - tapCandidate.time > TAP_MAX_DURATION_MS) {
      tapCandidate = null
      return false
    }

    const isDouble =
      lastTap &&
      now - lastTap.time < DOUBLE_TAP_MAX_DELAY_MS &&
      Math.hypot(tapCandidate.x - lastTap.x, tapCandidate.y - lastTap.y) < DOUBLE_TAP_MAX_MOVE_PX

    if (isDouble) {
      const anchor = { x: tapCandidate.x, y: tapCandidate.y }
      lastTap = null
      tapCandidate = null
      toggleZoomAt(anchor)
      return true
    }

    lastTap = { x: tapCandidate.x, y: tapCandidate.y, time: now }
    tapCandidate = null
    return false
  }

  function onTouchEnd(event) {
    const doubleTapped = detectDoubleTap()

    if (event.touches.length >= 2) return

    // Un doigt reste posé après un pincement : on enchaîne sur un déplacement.
    if (event.touches.length === 1) {
      if (isZoomed.value) {
        beginPan(event.touches[0])
      } else {
        gesture = null
      }
      return
    }

    gesture = null
    pinchStart = null
    panStart = null

    if (!doubleTapped) {
      settle()
    }
  }

  function onDoubleClick(event) {
    toggleZoomAt({ x: event.clientX, y: event.clientY })
  }

  return {
    scale,
    translateX,
    translateY,
    transitionMs,
    isZoomed,
    transformStyle,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onDoubleClick,
    reset,
  }
}
