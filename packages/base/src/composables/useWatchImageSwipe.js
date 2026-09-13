import { ref, computed, onMounted, onUnmounted, unref, nextTick, watch } from 'vue'

function resolveImageCount(source) {
  const raw = typeof source === 'function' ? source() : unref(source)
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0
}

const BUTTON_TRANSITION_MS = 200
const MIN_SWIPE_TRANSITION_MS = 120
const MAX_SWIPE_TRANSITION_MS = 450
const SWIPE_COMMIT_RATIO = 0.2
const SWIPE_COMMIT_MIN_PX = 40
const MIN_SWIPE_VELOCITY = 0.35

/** Axe indéterminé tant que le doigt (ou le curseur) n'a pas bougé d'autant. */
const AXIS_LOCK_PX = 8

/** En deçà, le geste souris reste un clic : on ne le confisque pas. */
const MOUSE_DRAG_CLICK_GUARD_PX = 5

function wrapIndex(index, count) {
  if (count <= 0) return 0
  const safe = Number(index)
  if (!Number.isFinite(safe)) return 0
  return ((Math.trunc(safe) % count) + count) % count
}

function isAdjacentIndex(from, to, count) {
  if (from === to) return true
  if (Math.abs(from - to) === 1) return true
  if (count > 1 && from === 0 && to === count - 1) return true
  if (count > 1 && from === count - 1 && to === 0) return true
  return false
}

export function useWatchImageSwipe({
  imageCount,
  containerRef,
  currentIndex,
  onIndexChange,
  swipeDisabled,
  mouseDragEnabled,
}) {
  const dragOffset = ref(0)
  const transitionMs = ref(0)
  const isDragging = ref(false)

  const slideWidth = ref(0)

  let dragStartX = 0
  let dragStartY = 0
  let lastDragX = 0
  let lastDragTime = 0
  let velocity = 0
  let isHorizontalSwipe = null
  /** `'touch'` ou `'mouse'` : le geste en cours, `null` au repos. */
  let dragPointer = null
  let mouseDragDistance = 0
  let resizeObserver = null
  let clickGuardTimeout = null

  const count = computed(() => resolveImageCount(imageCount))
  const isSwipeDisabled = computed(() => {
    const raw = typeof swipeDisabled === 'function' ? swipeDisabled() : unref(swipeDisabled)
    return Boolean(raw)
  })
  const isMouseDragEnabled = computed(() => {
    const raw =
      typeof mouseDragEnabled === 'function' ? mouseDragEnabled() : unref(mouseDragEnabled)
    return Boolean(raw)
  })

  const trackStyle = computed(() => ({
    transform: `translate3d(${-currentIndex.value * slideWidth.value + dragOffset.value}px, 0, 0)`,
    transition:
      transitionMs.value > 0 ? `transform ${transitionMs.value}ms ease-out` : 'none',
    willChange: 'transform',
  }))

  function syncSlideWidth() {
    slideWidth.value = containerRef.value?.clientWidth ?? 0
  }

  // Le zoom peut prendre la main en cours de glissement (second doigt posé) :
  // on abandonne le drag en cours pour éviter une piste figée en travers.
  watch(isSwipeDisabled, (disabled) => {
    if (!disabled) return
    detachMouseListeners()
    isDragging.value = false
    isHorizontalSwipe = null
    dragPointer = null
    dragOffset.value = 0
    transitionMs.value = 0
  })

  function setIndex(nextIndex, { animate = true, fast = true } = {}) {
    const total = count.value
    if (total <= 0) return

    const normalized = wrapIndex(nextIndex, total)
    if (normalized === currentIndex.value) {
      dragOffset.value = 0
      transitionMs.value = 0
      return
    }

    if (!animate || !isAdjacentIndex(currentIndex.value, normalized, total)) {
      transitionMs.value = 0
    } else {
      transitionMs.value = fast ? BUTTON_TRANSITION_MS : MIN_SWIPE_TRANSITION_MS
    }

    currentIndex.value = normalized
    dragOffset.value = 0
    onIndexChange?.(normalized)
  }

  function nextImage({ fast = true } = {}) {
    if (count.value <= 1) return
    setIndex(currentIndex.value + 1, { animate: true, fast })
  }

  function previousImage({ fast = true } = {}) {
    if (count.value <= 1) return
    setIndex(currentIndex.value - 1, { animate: true, fast })
  }

  function goToIndex(index, { fast = true } = {}) {
    if (count.value <= 1) return
    setIndex(index, { animate: true, fast })
  }

  function swipeTransitionMs(remainingDistance) {
    const speed = Math.max(Math.abs(velocity), 0.45)
    return Math.min(
      MAX_SWIPE_TRANSITION_MS,
      Math.max(MIN_SWIPE_TRANSITION_MS, remainingDistance / speed),
    )
  }

  /* ------------------------------------------------- Geste, sans son pointeur */

  function beginDrag(clientX, clientY, pointer) {
    if (count.value <= 1 || isSwipeDisabled.value) return false

    transitionMs.value = 0
    isDragging.value = true
    isHorizontalSwipe = null
    dragPointer = pointer
    dragStartX = clientX
    dragStartY = clientY
    lastDragX = clientX
    lastDragTime = performance.now()
    velocity = 0
    return true
  }

  /** @returns {boolean} vrai quand le mouvement est pris en charge par la piste. */
  function updateDrag(clientX, clientY) {
    if (!isDragging.value || count.value <= 1 || isSwipeDisabled.value) return false

    const deltaX = clientX - dragStartX
    const deltaY = clientY - dragStartY

    if (isHorizontalSwipe === null) {
      if (Math.abs(deltaX) < AXIS_LOCK_PX && Math.abs(deltaY) < AXIS_LOCK_PX) return false
      isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY)
    }

    if (!isHorizontalSwipe) return false

    const now = performance.now()
    const dt = now - lastDragTime
    if (dt > 0) {
      velocity = (clientX - lastDragX) / dt
    }
    lastDragX = clientX
    lastDragTime = now

    const atStart = currentIndex.value === 0
    const atEnd = currentIndex.value === count.value - 1

    let offset = deltaX
    if ((atStart && offset > 0) || (atEnd && offset < 0)) {
      offset *= 0.35
    }

    dragOffset.value = offset
    return true
  }

  function endDrag() {
    if (!isDragging.value) return
    isDragging.value = false
    dragPointer = null

    if (!isHorizontalSwipe || count.value <= 1 || isSwipeDisabled.value) {
      dragOffset.value = 0
      transitionMs.value = 0
      isHorizontalSwipe = null
      return
    }

    const width = slideWidth.value || 0
    const offset = dragOffset.value
    const threshold = Math.max(width * SWIPE_COMMIT_RATIO, SWIPE_COMMIT_MIN_PX)

    let direction = 0
    if (offset > threshold || (offset > 20 && velocity > MIN_SWIPE_VELOCITY)) {
      direction = -1
    } else if (offset < -threshold || (offset < -20 && velocity < -MIN_SWIPE_VELOCITY)) {
      direction = 1
    }

    if (direction !== 0) {
      const nextIndex = wrapIndex(currentIndex.value + direction, count.value)
      const remaining =
        direction > 0 ? Math.max(width + offset, 0) : Math.max(width - offset, 0)
      transitionMs.value = swipeTransitionMs(remaining)
      currentIndex.value = nextIndex
      dragOffset.value = 0
      onIndexChange?.(nextIndex)
    } else {
      transitionMs.value = swipeTransitionMs(Math.abs(offset))
      dragOffset.value = 0
    }

    isHorizontalSwipe = null
  }

  /* ---------------------------------------------------------------- Tactile */

  function onTouchStart(event) {
    const touch = event.touches?.[0]
    if (!touch) return
    beginDrag(touch.clientX, touch.clientY, 'touch')
  }

  function onTouchMove(event) {
    if (dragPointer !== 'touch') return

    const touch = event.touches?.[0]
    if (!touch) return

    if (updateDrag(touch.clientX, touch.clientY)) event.preventDefault()
  }

  function onTouchEnd() {
    if (dragPointer !== 'touch') return
    endDrag()
  }

  /* ------------------------------------------------------------------ Souris */

  /**
   * Glissement à la souris, jumeau du swipe tactile : sur une fenêtre étroite
   * d'ordinateur les flèches sont masquées (elles sont réservées au tactile,
   * qui swipe), et le curseur n'avait alors que les pastilles pour changer
   * d'image. Le geste est identique — seuil, inertie, rebond aux extrémités.
   */
  function onMouseDown(event) {
    if (!isMouseDragEnabled.value || event.button !== 0) return
    if (!beginDrag(event.clientX, event.clientY, 'mouse')) return

    mouseDragDistance = 0
    // Coupe la sélection de texte et le drag natif de l'image pendant le geste.
    event.preventDefault()

    window.addEventListener('mousemove', onWindowMouseMove)
    window.addEventListener('mouseup', onWindowMouseUp)
  }

  function onWindowMouseMove(event) {
    if (dragPointer !== 'mouse') return

    // Bouton relâché hors de la fenêtre : le `mouseup` ne nous parviendra pas.
    if (event.buttons === 0) {
      finishMouseDrag()
      return
    }

    mouseDragDistance = Math.max(mouseDragDistance, Math.abs(event.clientX - dragStartX))
    updateDrag(event.clientX, event.clientY)
  }

  function onWindowMouseUp() {
    if (dragPointer !== 'mouse') return
    finishMouseDrag()
  }

  function finishMouseDrag() {
    detachMouseListeners()
    const hasMoved = mouseDragDistance > MOUSE_DRAG_CLICK_GUARD_PX
    mouseDragDistance = 0
    endDrag()
    if (hasMoved) swallowNextClick()
  }

  function detachMouseListeners() {
    if (typeof window === 'undefined') return
    window.removeEventListener('mousemove', onWindowMouseMove)
    window.removeEventListener('mouseup', onWindowMouseUp)
  }

  /**
   * Un glissement se termine par un `click` sur l'ancêtre commun du bouton
   * enfoncé et relâché — le fond de la visionneuse quand le curseur a quitté la
   * photo, ce qui la refermait en fin de geste. On avale ce clic parasite.
   */
  function onGuardedClick(event) {
    event.stopPropagation()
    event.preventDefault()
    releaseClickGuard()
  }

  function swallowNextClick() {
    if (typeof window === 'undefined') return

    releaseClickGuard()
    window.addEventListener('click', onGuardedClick, true)
    // Tout glissement ne produit pas un clic : la garde tombe au tour suivant.
    clickGuardTimeout = setTimeout(releaseClickGuard, 0)
  }

  function releaseClickGuard() {
    if (typeof window === 'undefined') return
    if (clickGuardTimeout) {
      clearTimeout(clickGuardTimeout)
      clickGuardTimeout = null
    }
    window.removeEventListener('click', onGuardedClick, true)
  }

  onMounted(async () => {
    await nextTick()
    syncSlideWidth()
    if (typeof ResizeObserver !== 'undefined' && containerRef.value) {
      resizeObserver = new ResizeObserver(syncSlideWidth)
      resizeObserver.observe(containerRef.value)
    } else {
      window.addEventListener('resize', syncSlideWidth)
    }
  })

  onUnmounted(() => {
    resizeObserver?.disconnect()
    window.removeEventListener('resize', syncSlideWidth)
    detachMouseListeners()
    releaseClickGuard()
  })

  return {
    dragOffset,
    transitionMs,
    isDragging,
    trackStyle,
    nextImage,
    previousImage,
    goToIndex,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onMouseDown,
    syncSlideWidth,
  }
}
