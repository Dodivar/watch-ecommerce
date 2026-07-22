/**
 * Limiteur de débit en mémoire (fenêtre glissante) pour les endpoints publics
 * sensibles au spam (ex. inscription newsletter). Par process : suffisant pour
 * freiner un abus simple sans dépendance externe.
 */

/**
 * @param {{ windowMs: number, max: number }} options
 * @returns {{ check(key: string, now?: number): boolean }}
 */
function createRateLimiter({ windowMs, max }) {
  /** @type {Map<string, number[]>} clé → horodatages des requêtes dans la fenêtre */
  const hits = new Map()

  return {
    /**
     * Enregistre une tentative et indique si elle est autorisée.
     * @param {string} key
     * @param {number} [now]
     */
    check(key, now = Date.now()) {
      const cutoff = now - windowMs
      let list = hits.get(key)
      if (!list) {
        list = []
        hits.set(key, list)
      }
      while (list.length > 0 && list[0] <= cutoff) list.shift()
      if (list.length >= max) return false
      list.push(now)

      // Nettoyage opportuniste : purge les clés inactives pour borner la mémoire.
      if (hits.size > 10000) {
        for (const [k, v] of hits) {
          if (v.length === 0 || v[v.length - 1] <= cutoff) hits.delete(k)
        }
      }
      return true
    },
  }
}

module.exports = { createRateLimiter }
