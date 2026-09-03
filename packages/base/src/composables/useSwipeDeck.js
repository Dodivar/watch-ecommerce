import { computed, onBeforeUnmount, onMounted, ref, unref } from 'vue'

/**
 * Geste de la carte « coup de foudre » : glisser à droite (coup de cœur) ou à gauche (passer).
 *
 * Distinct de `useWatchImageSwipe.js`, qui est un moteur de piste de carrousel (index
 * circulaire, retour élastique, tactile seulement). Ici la carte **part** quand le geste est
 * engagé, et le desktop compte autant que le mobile.
 *
 * ## Deux familles d'événements, une seule mécanique
 *
 * Le doigt est servi par les **Touch Events**, la souris et le stylet par les **Pointer
 * Events**. Les Pointer Events seuls ne suffisaient pas : Safari iOS ouvre bien un
 * `pointerdown` au doigt, puis émet `pointercancel` dès qu'il soupçonne un défilement de
 * page — souvent sans avoir livré le moindre `pointermove`. La carte ne bougeait donc pas
 * d'un pixel sur iPhone, là où la souris la faisait voler. Les `touchmove`, eux, continuent
 * d'arriver, et le `preventDefault()` posé dessus reprend le geste au navigateur.
 *
 * La première famille arrivée ouvre le geste et le garde (`gestureSource`) : sur iOS le
 * `touchstart` qui suit le `pointerdown` reprend simplement la main sans rejouer l'amorce, et
 * le `pointercancel` de Safari est alors ignoré au lieu de reposer la carte en plein
 * glissement.
 *
 * Les seuils reprennent ceux éprouvés par le carrousel : geste engagé au-delà de 40 px ou
 * d'un quart de la largeur de carte, ou dès 20 px si la vitesse dépasse 0,35 px/ms.
 *
 * Le geste est libre : passé 8 px dans n'importe quelle direction, la carte suit le pointeur
 * en deux dimensions, et seule l'horizontale décide. Monter puis filer sur le côté reste donc
 * un seul et même glissement. Il n'y a pas de verrou d'axe : trancher sur l'amorce condamnait
 * les gestes qui ne partent pas droit — un doigt décolle en arc, là où une souris part droit
 * dès le premier pixel.
 *
 * En contrepartie la carte réclame le geste au navigateur (`touch-action: none` côté deck,
 * doublé du `preventDefault()` sur `touchmove` pour iOS) : sans cela le défilement vertical de
 * la page happe toute amorce vers le haut. La page se fait donc défiler à côté de la carte,
 * pas au travers.
 *
 * `prefers-reduced-motion` retire l'envol, la rotation et le ressort — mais pas le suivi du
 * doigt : une carte collée au doigt n'est pas une animation, c'est la manipulation directe de
 * l'objet touché, et la supprimer laissait l'écran sans la moindre réponse au geste.
 *
 * @param {object} options
 * @param {import('vue').Ref<HTMLElement | null>} options.cardRef
 * @param {(direction: 1 | -1) => void} options.onCommit  Appelé une fois la carte sortie.
 * @param {() => void} [options.onTap]  Appui sans glissement (ouvrir le détail).
 * @param {import('vue').MaybeRef<boolean> | (() => boolean)} [options.disabled]
 */
export function useSwipeDeck({ cardRef, onCommit, onTap, disabled }) {
  /** Distance à partir de laquelle le pointeur emmène la carte, toutes directions confondues. */
  const DRAG_START_PX = 8
  /** Tolérance d'appui : 6 px à la souris, la largeur du « slop » tactile au doigt. */
  const TAP_MAX_PX = 6
  const TAP_MAX_TOUCH_PX = 12
  const TAP_MAX_MS = 350
  const COMMIT_MIN_PX = 40
  const COMMIT_RATIO = 0.25
  const COMMIT_MIN_VELOCITY = 0.35
  const MAX_ROTATE_DEG = 12
  const EXIT_MS = 420
  const EXIT_REDUCED_MS = 120
  const SPRING_MS = 180
  /** Repos : la carte qui passe devant glisse de sa place d'attente à sa place finale. */
  const SETTLE_TRANSITION = 'transform 360ms cubic-bezier(0.2, 0.7, 0.2, 1), opacity 360ms ease'
  const EXIT_EASING = 'cubic-bezier(0.22, 0.61, 0.36, 1)'

  const dx = ref(0)
  const dy = ref(0)
  const isDragging = ref(false)
  const isLeaving = ref(false)
  /** @type {import('vue').Ref<1 | -1 | 0>} */
  const leaveDirection = ref(0)
  const transitionMs = ref(0)
  const reducedMotion = ref(false)

  /** @type {'touch' | 'pointer' | null} Famille d'événements qui pilote le geste en cours. */
  let gestureSource = null
  let pointerId = null
  let touchId = null
  let startX = 0
  let startY = 0
  let startTime = 0
  let lastX = 0
  let lastTime = 0
  let velocity = 0
  let isEngaged = false
  let tapSlop = TAP_MAX_PX
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
    const easing = isLeaving.value ? EXIT_EASING : 'ease-out'
    const transition = isDragging.value
      ? 'none'
      : transitionMs.value > 0
        ? `transform ${transitionMs.value}ms ${easing}, opacity ${transitionMs.value}ms ${easing}`
        : SETTLE_TRANSITION
    // Mouvement réduit : la carte suit toujours le doigt (manipulation directe), mais sans
    // rotation, et elle s'efface au lieu de s'envoler.
    const rotate = reducedMotion.value
      ? 0
      : Math.max(
          -MAX_ROTATE_DEG,
          Math.min(MAX_ROTATE_DEG, (dx.value / cardWidth()) * MAX_ROTATE_DEG),
        )
    return {
      transform: `translate3d(${dx.value}px, ${dy.value}px, 0) rotate(${rotate.toFixed(2)}deg)`,
      opacity: reducedMotion.value && isLeaving.value ? 0 : 1,
      transition,
      willChange: 'transform',
      zIndex: 40,
    }
  })

  function resetPosition({ animate } = { animate: true }) {
    transitionMs.value = animate ? SPRING_MS : 0
    dx.value = 0
    dy.value = 0
    isDragging.value = false
    isEngaged = false
    gestureSource = null
    pointerId = null
    touchId = null
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
    gestureSource = null
    pointerId = null
    touchId = null
    isEngaged = false

    const duration = reducedMotion.value ? EXIT_REDUCED_MS : EXIT_MS
    transitionMs.value = duration
    if (!reducedMotion.value) {
      // 1,2 largeur en 420 ms : la carte quitte l'écran sans filer.
      dx.value = direction * cardWidth() * 1.2
      dy.value = dy.value || 0
    }

    exitTimer = setTimeout(() => {
      exitTimer = null
      onCommit?.(direction)
      // La carte suivante, déjà remontée pendant la sortie, devient la carte du dessus.
      isLeaving.value = false
      leaveDirection.value = 0
      resetPosition({ animate: false })
    }, duration)
  }

  /* --------------------------------------------------- Mécanique commune du geste */

  function beginGesture(x, y, slop) {
    startX = lastX = x
    startY = y
    startTime = lastTime = performance.now()
    velocity = 0
    isEngaged = false
    tapSlop = slop
    movedBeyondTap = false
    transitionMs.value = 0
    isDragging.value = true
  }

  /**
   * Déplace la carte si le geste est engagé.
   * @returns {boolean} vrai quand la carte a pris le geste (le navigateur doit lâcher prise).
   */
  function moveGesture(x, y) {
    const deltaX = x - startX
    const deltaY = y - startY

    if (!movedBeyondTap && (Math.abs(deltaX) > tapSlop || Math.abs(deltaY) > tapSlop)) {
      movedBeyondTap = true
    }

    // Aucun axe n'est verrouillé : la carte prend le geste dès qu'il dépasse le seuil, quelle
    // que soit sa direction, et le suit ensuite partout où il va.
    if (!isEngaged) {
      if (Math.abs(deltaX) < DRAG_START_PX && Math.abs(deltaY) < DRAG_START_PX) return false
      isEngaged = true
    }

    const now = performance.now()
    const elapsed = now - lastTime
    if (elapsed > 0) velocity = (x - lastX) / elapsed
    lastX = x
    lastTime = now

    dx.value = deltaX
    dy.value = deltaY
    return true
  }

  /** Relâchement : appui, retour au repos, ou envol selon la distance et la vitesse. */
  function endGesture() {
    const elapsed = performance.now() - startTime
    gestureSource = null
    pointerId = null
    touchId = null

    // Un appui au doigt tremble : la carte a pu suivre de quelques pixels, on la repose en
    // douceur plutôt que de la faire sauter à sa place sous le détail qui s'ouvre.
    if (!movedBeyondTap && elapsed < TAP_MAX_MS) {
      resetPosition()
      onTap?.()
      return
    }

    if (!isEngaged) {
      resetPosition()
      return
    }

    const distance = Math.abs(dx.value)
    const fast = distance > 20 && Math.abs(velocity) > COMMIT_MIN_VELOCITY
    const shouldCommit = distance > commitThreshold() || fast
    if (shouldCommit) {
      fly(Math.sign(dx.value) || (velocity > 0 ? 1 : -1))
      return
    }
    resetPosition()
  }

  /* ------------------------------------------------------------- Touch Events (doigt) */

  function findTouch(list) {
    if (!list) return null
    for (const touch of list) {
      if (touch.identifier === touchId) return touch
    }
    return null
  }

  function onTouchStart(event) {
    if (isDisabled.value || isLeaving.value) return
    // Un second doigt posé n'ouvre pas un second geste : la carte n'en suit qu'un.
    if (gestureSource === 'touch') return
    const touch = event.changedTouches?.[0]
    if (!touch) return
    touchId = touch.identifier
    // `pointerdown` a pu ouvrir le geste pour ce même doigt (Chrome le précède) : on lui
    // reprend la main sans rejouer l'amorce, les coordonnées de départ étant les mêmes.
    if (gestureSource !== 'pointer') beginGesture(touch.clientX, touch.clientY, TAP_MAX_TOUCH_PX)
    gestureSource = 'touch'
  }

  function onTouchMove(event) {
    if (gestureSource !== 'touch') return
    const touch = findTouch(event.changedTouches)
    if (!touch) return
    const taken = moveGesture(touch.clientX, touch.clientY)
    // Safari iOS n'honore pas toujours `touch-action` : c'est ce `preventDefault` qui
    // empêche la page de happer le geste et d'annuler le glissement en cours.
    if (taken && event.cancelable) event.preventDefault()
  }

  /** Un autre doigt qui se lève ne clôt pas le geste ; un événement sans liste, si. */
  function endsGesture(event) {
    return !event.changedTouches || Boolean(findTouch(event.changedTouches))
  }

  function onTouchEnd(event) {
    if (gestureSource !== 'touch' || !endsGesture(event)) return
    endGesture()
  }

  function onTouchCancel(event) {
    if (gestureSource !== 'touch' || !endsGesture(event)) return
    resetPosition()
  }

  /* ------------------------------------------------ Pointer Events (souris, stylet) */

  function onPointerDown(event) {
    if (isDisabled.value || isLeaving.value) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    // Le doigt est déjà servi par les Touch Events : on ne double pas le geste.
    if (gestureSource === 'touch') return
    gestureSource = 'pointer'
    pointerId = event.pointerId
    beginGesture(
      event.clientX,
      event.clientY,
      event.pointerType === 'mouse' ? TAP_MAX_PX : TAP_MAX_TOUCH_PX,
    )
    try {
      event.currentTarget?.setPointerCapture?.(event.pointerId)
    } catch {
      /* certains navigateurs refusent la capture sur un pointeur déjà relâché */
    }
  }

  function onPointerMove(event) {
    if (gestureSource !== 'pointer' || event.pointerId !== pointerId) return
    if (moveGesture(event.clientX, event.clientY) && event.cancelable) event.preventDefault()
  }

  function onPointerUp(event) {
    if (gestureSource !== 'pointer' || event.pointerId !== pointerId) return
    endGesture()
  }

  /**
   * Safari iOS annule le flux Pointer dès qu'il soupçonne un défilement, alors que le doigt
   * est toujours posé et que les `touchmove` continuent : ce garde-fou évite de reposer la
   * carte au milieu d'un geste que les Touch Events mènent très bien à son terme.
   */
  function onPointerCancel(event) {
    if (gestureSource !== 'pointer' || event.pointerId !== pointerId) return
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
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onClickCapture,
  }
}
