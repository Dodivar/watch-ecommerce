/**
 * Rythme visuel de la page d'accueil : chaque section reçoit une « bande »,
 * alternée entre l'aplat de marque (`primary`) et le blanc (`light`).
 *
 * Le rendu n'est branché que sur les sites au thème vert
 * (`theme.colorScheme: 'dark'`, cf. `assets/theme-dark.css`) ; ailleurs les
 * classes sont posées mais sans style associé, les sections gardent leur fond.
 */

/** Tons de bande reconnus. */
export const HOME_BAND_PRIMARY = 'primary'
export const HOME_BAND_LIGHT = 'light'

/**
 * Sections qui montrent beaucoup de montres à la file : les vignettes se lisent
 * mieux sur blanc, elles ne suivent donc pas l'alternance si celle-ci les
 * poserait sur l'aplat de marque — c'est l'alternance qui se décale.
 */
const LIGHT_ONLY_SECTION_IDS = new Set(['nouvelles', 'ventes', 'collectionHighlight'])

/**
 * Alterne les bandes en partant de `primary` pour la première section.
 * Quand une section « montres » tombe sur `primary`, elle bascule en `light`
 * et la parité s'inverse pour la suite, afin de ne jamais coller deux bandes
 * de même ton.
 *
 * @param {string[]} sections Ids de sections déjà filtrés (cf. `homeSections.js`).
 * @returns {Array<'primary' | 'light'>} Un ton par section, dans le même ordre.
 */
export function resolveHomeBands(sections) {
  if (!Array.isArray(sections)) return []

  let tone = HOME_BAND_PRIMARY

  return sections.map((id) => {
    if (tone === HOME_BAND_PRIMARY && LIGHT_ONLY_SECTION_IDS.has(id)) {
      tone = HOME_BAND_LIGHT
    }

    const current = tone
    tone = current === HOME_BAND_PRIMARY ? HOME_BAND_LIGHT : HOME_BAND_PRIMARY
    return current
  })
}

/**
 * Classes à poser sur la section, consommées par `theme-dark.css`.
 *
 * @param {'primary' | 'light'} tone
 * @returns {string}
 */
export function homeBandClass(tone) {
  return `home-band home-band--${tone === HOME_BAND_LIGHT ? HOME_BAND_LIGHT : HOME_BAND_PRIMARY}`
}
