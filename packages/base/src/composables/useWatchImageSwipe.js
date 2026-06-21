import { ref, computed, onMounted, onUnmounted, unref, nextTick } from 'vue'

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
}) {
  const dragOffset = ref(0)
  const transitionMs = ref(0)
  const isDragging = ref(false)

  const slideWidth = ref(0)

  let touchStartX = 0
  let touchStartY = 0
  let lastTouchX = 0
  let lastTouchTime = 0
  let velocity = 0
  let isHorizontalSwipe = null
  let resizeObserver = null

  const count = computed(() => resolveImageCount(imageCount))

  const trackStyle = computed(() => ({
    transform: `translate3d(${-currentIndex.value * slideWidth.value + dragOffset.value}px, 0, 0)`,
    transition:
      transitionMs.value > 0 ? `transform ${transitionMs.value}ms ease-out` : 'none',
    willChange: 'transform',
  }))

  function syncSlideWidth() {
    slideWidth.value = containerRef.value?.clientWidth ?? 0
  }

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

  function onTouchStart(event) {
    if (count.value <= 1) return

    const touch = event.touches[0]
    transitionMs.value = 0
    isDragging.value = true
    isHorizontalSwipe = null
    touchStartX = touch.clientX
    touchStartY = touch.clientY
    lastTouchX = touch.clientX
    lastTouchTime = performance.now()
    velocity = 0
  }

  function onTouchMove(event) {
    if (!isDragging.value || count.value <= 1) return

    const touch = event.touches[0]
    const deltaX = touch.clientX - touchStartX
    const deltaY = touch.clientY - touchStartY

    if (isHorizontalSwipe === null) {
      if (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) return
      isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY)
    }

    if (!isHorizontalSwipe) return

    event.preventDefault()

    const now = performance.now()
    const dt = now - lastTouchTime
    if (dt > 0) {
      velocity = (touch.clientX - lastTouchX) / dt
    }
    lastTouchX = touch.clientX
    lastTouchTime = now

    const atStart = currentIndex.value === 0
    const atEnd = currentIndex.value === count.value - 1

    let offset = deltaX
    if ((atStart && offset > 0) || (atEnd && offset < 0)) {
      offset *= 0.35
    }

    dragOffset.value = offset
  }

  function onTouchEnd() {
    if (!isDragging.value) return
    isDragging.value = false

    if (!isHorizontalSwipe || count.value <= 1) {
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
    syncSlideWidth,
  }
}
