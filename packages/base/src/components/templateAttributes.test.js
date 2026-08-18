/**
 * Garde-fou sur les attributs de template.
 *
 * Un `::aria-label="…"` (deux-points en trop, typiquement en préfixant un attribut **déjà** lié)
 * reste syntaxiquement valide : Vue le compile en un attribut littéralement nommé `:aria-label`,
 * si bien que le vrai `aria-label` disparaît et que l'élément perd son nom accessible. Ni ESLint
 * ni les tests de rendu ne le voient — d'où ce contrôle, dans le même esprit que
 * `i18n/messages/messageUsage.test.js`.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'
import { compile } from '@vue/compiler-dom'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC_DIR = path.resolve(__dirname, '..')

/** @param {string} dir @returns {string[]} */
function listVueFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return listVueFiles(full)
    return entry.name.endsWith('.vue') ? [full] : []
  })
}

const VUE_FILES = listVueFiles(SRC_DIR)

describe('attributs de template', () => {
  it('trouve bien des composants à vérifier (garde-fou du test lui-même)', () => {
    expect(VUE_FILES.length).toBeGreaterThan(50)
  })

  it('ne double jamais le deux-points d’une liaison (`::attr`)', () => {
    const offenders = []
    for (const file of VUE_FILES) {
      const content = fs.readFileSync(file, 'utf8')
      for (const match of content.matchAll(/::([a-zA-Z][\w-]*)=/g)) {
        offenders.push(`${path.relative(SRC_DIR, file)} → ::${match[1]}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('confirme que `::attr` perdrait bien l’attribut (raison d’être du test)', () => {
    // Si ce comportement de Vue changeait un jour, le test ci-dessus perdrait son sens.
    const render = (tpl) => compile(tpl, { mode: 'function' }).code
    expect(render('<div ::aria-label="x" />')).toContain('":aria-label"')
    expect(render('<div :aria-label="x" />')).toContain('"aria-label"')
  })
})
