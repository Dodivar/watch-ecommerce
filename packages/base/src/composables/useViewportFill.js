/**
 * Hauteur réellement disponible sous un élément, publiée dans une variable CSS.
 *
 * Les écrans du « coup de foudre » veulent tenir dans la hauteur d'écran sans défilement :
 * la barre d'action de l'onboarding se pose en bas, la pile de cartes du deck garde ses trois
 * boutons visibles. Cette hauteur ne se calcule pas en CSS — la barre de navigation du site
 * n'a pas la même hauteur d'une vitrine à l'autre, ni d'un format à l'autre (elle passe sur
 * deux lignes en paysage) — d'où la mesure.
 *
 * Deux termes sont retranchés de la hauteur d'écran : la position de l'élément dans la page
 * (tout ce qui le précède, en-tête du site compris) et la marge basse de son conteneur, sans
 * quoi la page dépasserait de cette marge et se laisserait défiler pour rien.
 *
 * Le clavier virtuel n'est volontairement pas suivi (`visualViewport`) : il ferait rétrécir
 * l'écran courant pendant la saisie du budget.
 */

import { onBeforeUnmount, onMounted, unref } from 'vue'

/**
 * @param {import('vue').Ref<HTMLElement | null>} target Élément qui reçoit la variable
 * @param {{ variable?: string }} [options]
 * @returns {{ measure: () => void }}
 */
export function useViewportFill(target, { variable = '--mm-fill' } = {}) {
  function measure() {
    const el = unref(target)
    if (!el || typeof window === 'undefined') return
    // Position dans le document (indépendante du défilement courant).
    const top = el.getBoundingClientRect().top + window.scrollY
    const parent = el.parentElement
    const gutter = parent ? Number.parseFloat(getComputedStyle(parent).paddingBottom) || 0 : 0
    const fill = Math.max(0, Math.round(window.innerHeight - top - gutter))
    el.style.setProperty(variable, `${fill}px`)
  }

  onMounted(() => {
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('orientationchange', measure)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', measure)
    window.removeEventListener('orientationchange', measure)
  })

  return { measure }
}
