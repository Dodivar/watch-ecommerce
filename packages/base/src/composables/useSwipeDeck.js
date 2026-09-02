import { computed, onBeforeUnmount, onMounted, ref, unref } from 'vue'

/**
 * Geste de la carte « coup de foudre » : glisser à droite (coup de cœur) ou à gauche (passer).
 *
 * Distinct de `useWatchImageSwipe.js`, qui est un moteur de piste de carrousel (index
 * circulaire, retour élastique, tactile seulement). Ici la carte **part** quand le geste est
 * engagé, et le desktop compte autant que le mobile : on écoute les Pointer Events, qui
 * couvrent souris, doigt et stylet d'un seul jeu d'écouteurs.
 *
 * Les seuils reprennent ceux éprouvés par le carrousel : verrouillage d'axe à 8 px, geste
 * engagé au-delà de 40 px ou d'un quart de la largeur de carte, ou dès 20 px si la vitesse
 * dépasse 0,35 px/ms. `prefers-reduced-motion` remplace l'envol et la rotation par un fondu.
 *
 * @param {object} options
 * @param {import('vue').Ref<HTMLElement | null>} options.cardRef
 * @param {(direction: 1 | -1) => void} options.onCommit  Appelé une fois la carte sortie.
 * @param {() => void} [options.onTap]  Appui sans glissement (ouvrir le détail).
 * @param {import('vue').MaybeRef<boolean> | (() => boolean)} [options.disabled]
 */
export function useSwipeDeck({ cardRef, onCommit, onTap, disabled }) {
  const AXIS_LOCK_PX = 8
  const TAP_MAX_PX = 6
  const TAP_MAX_MS = 350
  const COMMIT_MIN_PX = 40
  const COMMIT_RATIO = 0.25
  const COMMIT_MIN_VELOCITY = 0.35
  const MAX_ROTATE_DEG = 12
  const EXIT_MS = 260
  const EXIT_REDUCED_MS = 120
  const SPRING_MS = 180

  const dx = ref(0)
  const dy = ref(0)
  const isDragging = ref(false)
  const isLeaving = ref(false)
  /** @type {import('vue').Ref<1 | -1 | 0>} */
  const leaveDirection = ref(0)
  const transitionMs = ref(0)
  const reducedMotion = ref(false)

  let pointerId = null
  let startX = 0
  let startY = 0
  let startTime = 0
  let lastX = 0
  let lastTime = 0
  let velocity = 0
  let axis = null
  let movedBeyondTap = false
  let exitTimer = null
  let motionQuery = null

  const isDisabled = computed(() => {
    const raw = typeof disabled === 'function' ? disabled() : unref(disabled)
    return Boolean(raw)
  })

  function cardWidth() {
    return cardRef.value?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 360)
  }

  function commitThreshold() {
    return Math.max(COMMIT_MIN_PX, cardWidth() * COMMIT_RATIO)
  }

  /** Progression du geste vers l'engagement, 0 → 1, signée par la direction. */
  const progress = computed(() => {
    const threshold = commitThreshold()
    if (!threshold) return 0
    return Math.max(-1, Math.min(1, dx.value / threshold))
  })

  const likeOpacity = computed(() => Math.max(0, progress.value))
  const passOpacity = computed(() => Math.max(0, -progress.value))

  const cardStyle = computed(() => {
    const transition =
      transitionMs.value > 0
        ? `transform ${transitionMs.value}ms ease-out, opacity ${transitionMs.value}ms ease-out`
        : 'none'
    if (reducedMotion.value) {
      return {
        transform: 'none',
        opacity: isLeaving.value ? 0 : 1,
        transition,
        willChange: 'opacity',
      }
    }
    const rotate = Math.max(
      -MAX_ROTATE_DEG,
      Math.min(MAX_ROTATE_DEG, (dx.value / cardWidth()) * MAX_ROTATE_DEG),
    )
    return {
      transform: `translate3d(${dx.value}px, ${dy.value * 0.2}px, 0) rotate(${rotate.toFixed(2)}deg)`,
      opacity: 1,
      transition,
      willChange: 'transform',
    }
  })

  function resetPosition({ animate } = { animate: true }) {
    transitionMs.value = animate ? SPRING_MS : 0
    dx.value = 0
    dy.value = 0
    isDragging.value = false
    axis = null
    pointerId = null
    velocity = 0
  }

  /**
   * Fait sortir la carte puis notifie la décision. Utilisé par le geste comme par les
   * boutons et le clavier.
   * @param {1 | -1} direction
   */
  function fly(direction) {
    if (isLeaving.value || isDisabled.value) return
    isLeaving.value = true
    leaveDirection.value = direction
    isDragging.value = false
    pointerId = null
    axis = null

    const duration = reducedMotion.value ? EXIT_REDUCED_MS : EXIT_MS
    transitionMs.value = duration
    if (!reducedMotion.value) {
      dx.value = direction * cardWidth() * 1.4
      dy.value = dy.value || 0
    }

    exitTimer = setTimeout(() => {
      exitTimer = null
      onCommit?.(direction)
      // La carte suivante monte sans transition : elle n'a jamais bougé.
      isLeaving.value = false
      leaveDirection.value = 0
      resetPosition({ animate: false })
    }, duration)
  }

  function onPointerDown(event) {
    if (isDisabled.value || isLeaving.value) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    pointerId = event.pointerId
    startX = lastX = event.clientX
    startY = event.clientY
    startTime = lastTime = performance.now()
    velocity = 0
    axis = null
    movedBeyondTap = false
    transitionMs.value = 0
    isDragging.value = true
    try {
      event.currentTarget?.setPointerCapture?.(event.pointerId)
    } catch {
      /* certains navigateurs refusent la capture sur un pointeur déjà relâché */
    }
  }

  function onPointerMove(event) {
    if (pointerId === null || event.pointerId !== pointerId) return
    const deltaX = event.clientX - startX
    const deltaY = event.clientY - startY

    if (!movedBeyondTap && (Math.abs(deltaX) > TAP_MAX_PX || Math.abs(deltaY) > TAP_MAX_PX)) {
      movedBeyondTap = true
    }

    if (axis === null) {
      if (Math.abs(deltaX) < AXIS_LOCK_PX && Math.abs(deltaY) < AXIS_LOCK_PX) return
      axis = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical'
    }
    if (axis !== 'horizontal') return

    if (event.cancelable) event.preventDefault()

    const now = performance.now()
    const elapsed = now - lastTime
    if (elapsed > 0) velocity = (event.clientX - lastX) / elapsed
    lastX = event.clientX
    lastTime = now

    dx.value = deltaX
    dy.value = deltaY
  }

  function onPointerUp(event) {
    if (pointerId === null || event.pointerId !== pointerId) return
    const elapsed = performance.now() - startTime

    if (!movedBeyondTap && elapsed < TAP_MAX_MS) {
      resetPosition({ animate: false })
      onTap?.()
      return
    }

    if (axis !== 'horizontal') {
      resetPosition()
      return
    }

    const distance = Math.abs(dx.value)
    const fast = distance > 20 && Math.abs(velocity) > COMMIT_MIN_VELOCITY
    const shouldCommit = distance > commitThreshold() || fast
    if (shouldCommit) {
      const direction = Math.sign(dx.value) || (velocity > 0 ? 1 : -1)
      fly(direction)
      return
    }
    resetPosition()
  }

  function onPointerCancel(event) {
    if (pointerId === null || event.pointerId !== pointerId) return
    resetPosition()
  }

  /**
   * Un glissement relâché sur la carte déclenche aussi un `click` : on l'étouffe pour ne pas
   * ouvrir le détail d'une montre qu'on vient de passer.
   */
  function onClickCapture(event) {
    if (!movedBeyondTap) return
    movedBeyondTap = false
    event.stopPropagation()
    event.preventDefault()
  }

  function onMotionPreferenceChange(event) {
    reducedMotion.value = Boolean(event.matches)
  }

  onMounted(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotion.value = motionQuery.matches
    motionQuery.addEventListener?.('change', onMotionPreferenceChange)
  })

  onBeforeUnmount(() => {
    if (exitTimer) clearTimeout(exitTimer)
    motionQuery?.removeEventListener?.('change', onMotionPreferenceChange)
  })

  return {
    dx,
    isDragging,
    isLeaving,
    leaveDirection,
    reducedMotion,
    cardStyle,
    likeOpacity,
    passOpacity,
    swipe: fly,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onClickCapture,
  }
}
