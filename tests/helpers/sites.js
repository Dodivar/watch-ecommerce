import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const REPO_ROOT = path.resolve(__dirname, '../..')
export const SITES_DIR = path.join(REPO_ROOT, 'sites')

/**
 * Identifiants des sites buildables (hors gabarit `_template`).
 * @returns {string[]}
 */
export function listBuildableSiteIds() {
  if (!fs.existsSync(SITES_DIR)) return []
  return fs
    .readdirSync(SITES_DIR, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() && !entry.name.startsWith('_') && !entry.name.startsWith('.'),
    )
    .filter((entry) => fs.existsSync(path.join(SITES_DIR, entry.name, 'site.config.js')))
    .map((entry) => entry.name)
    .sort()
}

/**
 * @param {string} siteId
 * @returns {Promise<Record<string, unknown>>}
 */
export async function loadRawSiteConfig(siteId) {
  const cfgPath = path.join(SITES_DIR, siteId, 'site.config.js')
  if (!fs.existsSync(cfgPath)) {
    throw new Error(`sites/${siteId}/site.config.js introuvable`)
  }
  const mod = await import(pathToFileURL(cfgPath).href)
  if (!mod?.default || typeof mod.default !== 'object') {
    throw new Error(`sites/${siteId}/site.config.js doit exporter un objet par défaut`)
  }
  return mod.default
}
