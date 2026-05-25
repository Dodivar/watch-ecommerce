/**
 * Détermine si une route est active pour le jeu de feature flags donné.
 * @param {{ feature?: string, requiresFeatures?: string[] }} def
 * @param {Record<string, boolean>} features
 */
export function isRouteActiveForFeatures(def, features) {
  if (def.feature && !features[def.feature]) {
    return false
  }
  if (def.requiresFeatures?.length) {
    for (const key of def.requiresFeatures) {
      if (!features[key]) return false
    }
  }
  return true
}
