/**
 * Tampon de version du build : ce qui permet de savoir, depuis l'extérieur, quel commit
 * une vitrine sert réellement — et à un onglet resté ouvert de s'apercevoir qu'il est
 * en retard.
 *
 * Deux sorties pour la même valeur :
 *  - `import.meta.env.VITE_APP_VERSION`, figée dans le bundle au build ;
 *  - `/version.json`, fichier statique servi sans cache (voir `vercel.json`).
 *
 * Le bundle porte donc la version qu'il *est*, le fichier celle qui est *déployée* : leur
 * comparaison au retour sur l'onglet suffit à détecter un déploiement passé entre-temps
 * (`services/appVersion.js`, `composables/useAppUpdate.js`).
 */
import { execFileSync } from 'node:child_process'

/**
 * SHA du commit construit. Vercel le fournit dans l'environnement ; en local, git répond.
 *
 * @param {string} repoRoot
 * @returns {string}
 */
function resolveCommitSha(repoRoot) {
  const fromEnv = (process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || '').trim()
  if (fromEnv) return fromEnv

  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    // Build hors dépôt git (archive, conteneur sans git) : la version tombe sur l'horodatage.
    return ''
  }
}

/**
 * @param {string} repoRoot
 * @returns {string}
 */
function resolveBranch(repoRoot) {
  const fromEnv = (process.env.VERCEL_GIT_COMMIT_REF || '').trim()
  if (fromEnv) return fromEnv

  try {
    return execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return ''
  }
}

/**
 * Identité du build. `version` est la seule valeur comparée côté navigateur : le SHA court
 * quand il est connu, sinon l'horodatage — jamais vide, sans quoi deux builds successifs
 * paraîtraient identiques et aucune mise à jour ne serait jamais détectée.
 *
 * @param {{ siteId: string, repoRoot: string }} options
 * @returns {{ version: string, commit: string, branch: string, builtAt: string, siteId: string }}
 */
export function resolveBuildVersion({ siteId, repoRoot }) {
  const commit = resolveCommitSha(repoRoot)
  const builtAt = new Date().toISOString()

  return {
    version: commit ? commit.slice(0, 12) : `t${Date.parse(builtAt)}`,
    commit,
    branch: resolveBranch(repoRoot),
    builtAt,
    siteId,
  }
}

/**
 * Écrit `/version.json` à la racine du build et injecte la version dans le bundle.
 *
 * Le `define` est posé en toutes circonstances, `serve` compris : sans lui,
 * `import.meta.env.VITE_APP_VERSION` serait `undefined` en développement et le code qui la
 * lit lèverait au lieu de simplement se taire.
 *
 * @param {{ siteId: string, repoRoot: string }} options
 * @returns {import('vite').Plugin}
 */
export function buildVersionPlugin({ siteId, repoRoot }) {
  const buildVersion = resolveBuildVersion({ siteId, repoRoot })

  return {
    name: 'build-version',
    config() {
      return {
        define: {
          'import.meta.env.VITE_APP_VERSION': JSON.stringify(buildVersion.version),
        },
      }
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: `${JSON.stringify(buildVersion, null, 2)}\n`,
      })
    },
    closeBundle() {
      console.log(
        `[build-version] ${buildVersion.siteId} @ ${buildVersion.version}` +
          `${buildVersion.branch ? ` (${buildVersion.branch})` : ''} — /version.json écrit.`,
      )
    },
  }
}
