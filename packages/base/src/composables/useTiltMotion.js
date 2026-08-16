import { computed, onBeforeUnmount, ref, watch } from 'vue'

/**
 * Incline un élément en 3D vers le pointeur, ou selon l'inclinaison du
 * téléphone quand un gyroscope répond.
 *
 * L'élément « regarde » le curseur : le bord survolé avance vers le lecteur,
 * comme une pièce qu'on oriente derrière une vitrine.
 *
 * À savoir :
 * - `prefers-reduced-motion` coupe tout, écouteurs compris.
 * - Le pointeur a la priorité : tant que la souris survole, le gyroscope se tait.
 * - iOS 13+ n'émet `deviceorientation` qu'après un
 *   `DeviceOrientationEvent.requestPermission()` déclenché par un geste
 *   utilisateur. Sans affordance dédiée, la carte y reste simplement au repos.
 */

const DEFAULTS = {
  /** Amplitude maximale de la rotation, en degrés, sur chaque axe. */
  maxTiltDeg: 7,
  /** Distance de l'œil : plus c'est petit, plus la perspective est marquée. */
  perspectivePx: 1200,
  /** Inclinaison du téléphone, en degrés, qui atteint l'amplitude maximale. */
  gyroRangeDeg: 18,
  /** Fraction du chemin restant parcourue à chaque frame (lissage). */
  easing: 0.16,
}

/** En deçà de cet écart, on fige sur la cible et on rend la main au navigateur. */
const SETTLED = 0.002

function clampUnit(value) {
  return Math.max(-1, Math.min(1, value))
}

/**
 * Le gyroscope raisonne dans le repère de l'appareil, pas dans celui de l'écran :
 * en paysage, le tangage et le roulis sont échangés. On reprojette les deltas
 * (gamma = roulis, beta = tangage) vers les axes vus par l'utilisateur.
 */
function projectToScreen(deltaGamma, deltaBeta, screenAngle) {
  switch (((screenAngle % 360) + 360) % 360) {
    case 90:
      return [deltaBeta, -deltaGamma]
    case 180:
      return [-deltaGamma, -deltaBeta]
    case 270:
      return [-deltaBeta, deltaGamma]
    default:
      return [deltaGamma, deltaBeta]
  }
}

function readScreenAngle() {
  const angle = window.screen?.orientation?.angle
  if (typeof angle === 'number') return angle
  return typeof window.orientation === 'number' ? window.orientation : 0
}

export function useTiltMotion(options = {}) {
  const { maxTiltDeg, perspectivePx, gyroRangeDeg, easing } = { ...DEFAULTS, ...options }

  /** À poser sur l'élément à incliner. */
  const tiltRef = ref(null)
  /** Inclinaison courante, normalisée : -1 (gauche/haut) → 1 (droite/bas). */
  const tiltX = ref(0)
  const tiltY = ref(0)

  let targetX = 0
  let targetY = 0
  let frame = null
  let listeningOn = null
  let pointerInside = false
  let gyroOrigin = null
  let motionQuery = null

  const tiltStyle = computed(() => ({
    // Exposés en variables pour que le CSS compose ombre et calques flottants.
    '--tilt-x': tiltX.value.toFixed(3),
    '--tilt-y': tiltY.value.toFixed(3),
    transform:
      `perspective(${perspectivePx}px)`
      + ` rotateX(${(tiltY.value * maxTiltDeg).toFixed(2)}deg)`
      + ` rotateY(${(-tiltX.value * maxTiltDeg).toFixed(2)}deg)`,
  }))

  function step() {
    const deltaX = targetX - tiltX.value
    const deltaY = targetY - tiltY.value

    if (Math.abs(deltaX) < SETTLED && Math.abs(deltaY) < SETTLED) {
      tiltX.value = targetX
      tiltY.value = targetY
      frame = null
      return
    }

    tiltX.value += deltaX * easing
    tiltY.value += deltaY * easing
    frame = requestAnimationFrame(step)
  }

  function aimAt(x, y) {
    targetX = clampUnit(x)
    targetY = clampUnit(y)
    if (frame === null) frame = requestAnimationFrame(step)
  }

  function handlePointerMove(event) {
    // Un doigt ne « survole » pas : sur tactile, c'est le gyroscope qui pilote.
    if (event.pointerType === 'touch') return

    const rect = tiltRef.value?.getBoundingClientRect()
    if (!rect?.width || !rect?.height) return

    pointerInside = true
    aimAt(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      ((event.clientY - rect.top) / rect.height) * 2 - 1,
    )
  }

  function handlePointerLeave() {
    pointerInside = false
    aimAt(0, 0)
  }

  function handleDeviceOrientation(event) {
    if (pointerInside) return

    const { beta, gamma } = event
    if (typeof beta !== 'number' || typeof gamma !== 'number') return

    // Première mesure = position de repos : un téléphone tenu incliné à 50°
    // doit partir de la carte à plat, pas de la butée.
    if (!gyroOrigin) {
      gyroOrigin = { beta, gamma }
      return
    }

    const [deltaX, deltaY] = projectToScreen(
      gamma - gyroOrigin.gamma,
      beta - gyroOrigin.beta,
      readScreenAngle(),
    )
    aimAt(deltaX / gyroRangeDeg, deltaY / gyroRangeDeg)
  }

  /** Basculer en paysage change le repère : on reprend une position de repos. */
  function resetGyroOrigin() {
    gyroOrigin = null
  }

  function attach(element) {
    if (listeningOn) return
    listeningOn = element

    element.addEventListener('pointermove', handlePointerMove, { passive: true })
    element.addEventListener('pointerleave', handlePointerLeave)
    window.addEventListener('deviceorientation', handleDeviceOrientation, { passive: true })
    window.addEventListener('orientationchange', resetGyroOrigin)
  }

  function detach() {
    if (listeningOn) {
      listeningOn.removeEventListener('pointermove', handlePointerMove)
      listeningOn.removeEventListener('pointerleave', handlePointerLeave)
      listeningOn = null
    }

    window.removeEventListener('deviceorientation', handleDeviceOrientation)
    window.removeEventListener('orientationchange', resetGyroOrigin)

    if (frame !== null) {
      cancelAnimationFrame(frame)
      frame = null
    }

    pointerInside = false
    gyroOrigin = null
    targetX = 0
    targetY = 0
    tiltX.value = 0
    tiltY.value = 0
  }

  function syncListeners() {
    const element = tiltRef.value
    detach()
    if (element && !motionQuery?.matches) attach(element)
  }

  if (typeof window !== 'undefined') {
    motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null
    motionQuery?.addEventListener?.('change', syncListeners)
    watch(tiltRef, syncListeners, { immediate: true })
  }

  onBeforeUnmount(() => {
    motionQuery?.removeEventListener?.('change', syncListeners)
    detach()
  })

  return { tiltRef, tiltStyle, tiltX, tiltY }
}
