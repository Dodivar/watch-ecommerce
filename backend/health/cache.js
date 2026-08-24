/**
 * Cache TTL + single-flight pour les endpoints de santé.
 *
 * Les checks profonds tapent des API tierces payantes (egress Supabase) ou
 * limitées (Stripe) : plusieurs moniteurs, plusieurs régions et un workflow
 * planifié doivent se partager un seul aller-retour réel par fenêtre.
 */

/**
 * @template T
 * @param {() => Promise<T>} fn
 * @param {number} ttlMs
 * @returns {{ run(options?: { force?: boolean }): Promise<T & { cached: boolean }>, reset(): void }}
 */
function createCachedRunner(fn, ttlMs) {
  /** @type {{ expiresAt: number, payload: any } | null} */
  let cache = null
  /** @type {Promise<any> | null} */
  let inflight = null

  return {
    async run(options = {}) {
      const now = Date.now()
      if (!options.force && cache && cache.expiresAt > now) {
        return { ...cache.payload, cached: true }
      }
      if (!inflight) {
        inflight = Promise.resolve()
          .then(fn)
          .then((payload) => {
            cache = { expiresAt: Date.now() + ttlMs, payload }
            return payload
          })
          .finally(() => {
            inflight = null
          })
      }
      const payload = await inflight
      return { ...payload, cached: false }
    },
    reset() {
      cache = null
      inflight = null
    },
  }
}

module.exports = { createCachedRunner }
