/**
 * Garde-fou de résolution des fonctions serverless.
 *
 * `api/sitemap.js` est déployé tel quel sur Vercel : ni Vite, ni ses alias. Un `@/…` ou un
 * `@site-config` glissé n'importe où dans sa chaîne d'imports — y compris à trois modules de
 * distance, via `resolveSiteConfig` — rend la fonction inchargeable, et le sitemap disparaît
 * sans que rien n'échoue au build.
 *
 * Vitest ne peut pas le voir : sa configuration déclare justement ces alias. D'où le sous-processus
 * Node nu, seul moyen de reproduire les conditions du déploiement.
 */
import { execFile } from 'node:child_process'
import path from 'node:path'
// Import explicite : la config ESLint ne donne les globales Node qu'à `api/`, `scripts/` et
// aux tests e2e — pas au reste de `tests/`.
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

import { describe, expect, it } from 'vitest'

const execFileAsync = promisify(execFile)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '../..')

/**
 * Importe un module dans un processus Node vierge et rend son erreur, le cas échéant.
 * @param {string} relativePath
 * @returns {Promise<{ ok: boolean, error: string }>}
 */
async function importInBareNode(relativePath) {
  const script = `
    import(${JSON.stringify(`./${relativePath}`)})
      .then((mod) => {
        if (typeof mod.default !== 'function') {
          console.log('ERREUR: export default absent ou non appelable')
          process.exitCode = 1
          return
        }
        console.log('OK')
      })
      .catch((err) => {
        console.log('ERREUR: ' + err.message.split('\\n')[0])
        process.exitCode = 1
      })
  `
  const { stdout } = await execFileAsync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: REPO_ROOT,
  }).catch((err) => ({ stdout: err.stdout ?? `ERREUR: ${err.message}` }))

  const output = String(stdout).trim()
  return { ok: output.startsWith('OK'), error: output }
}

describe('résolution des fonctions serverless', () => {
  it('charge api/sitemap.js dans un Node nu, sans alias Vite', async () => {
    const { ok, error } = await importInBareNode('api/sitemap.js')
    expect(ok, error).toBe(true)
  }, 30_000)
})
