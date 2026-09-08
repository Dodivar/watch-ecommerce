/**
 * Garde-fou sur l'emplacement des appels `useHead`.
 *
 * `useHead` doit être appelé pendant le `setup`, et une seule fois, en lui passant un `computed`
 * si le contenu dépend de données chargées après coup. Appelé depuis un `watch`, un `onMounted`
 * ou un `.then`, il s'exécute hors du `setup` : `getCurrentInstance()` y vaut `null`, donc unhead
 * ne pose pas son `onBeforeUnmount` (voir `clientUseHead` dans `@unhead/vue`) et n'enlève jamais
 * l'entrée. Les balises de la page — canonique, `og:*`, JSON-LD — survivent alors à la navigation
 * et viennent se coller aux pages suivantes, chaque visite empilant en plus son propre JSON-LD.
 *
 * Rien ne le signale : le build passe, les tests de rendu passent, et le symptôme n'apparaît
 * qu'en inspectant le `<head>` après plusieurs navigations. D'où ce contrôle statique, dans le
 * même esprit que `templateAttributes.test.js`.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC_DIR = path.resolve(__dirname, '..')

/** Appels qui diffèrent l'exécution hors du `setup`. */
const DEFERRED_CALLERS = new Set([
  'watch',
  'watchEffect',
  'watchPostEffect',
  'watchSyncEffect',
  'onMounted',
  'onBeforeMount',
  'onUpdated',
  'onActivated',
  'then',
  'setTimeout',
  'setInterval',
  'nextTick',
  'requestAnimationFrame',
])

/** @param {string} dir @returns {string[]} */
function listVueFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return listVueFiles(full)
    return entry.name.endsWith('.vue') ? [full] : []
  })
}

/**
 * Remplace le contenu des chaînes et commentaires par des espaces, en gardant les longueurs :
 * les index restent alignés sur la source, et une parenthèse écrite dans un libellé ne fausse
 * plus le comptage.
 *
 * @param {string} source
 * @returns {string}
 */
export function blankLiterals(source) {
  const out = source.split('')
  let i = 0
  const blankUntil = (end, from) => {
    for (let k = from; k < end && k < out.length; k += 1) {
      if (out[k] !== '\n') out[k] = ' '
    }
  }

  while (i < source.length) {
    const char = source[i]
    const next = source[i + 1]

    if (char === '/' && next === '/') {
      const end = source.indexOf('\n', i)
      const stop = end === -1 ? source.length : end
      blankUntil(stop, i)
      i = stop
      continue
    }
    if (char === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2)
      const stop = end === -1 ? source.length : end + 2
      blankUntil(stop, i)
      i = stop
      continue
    }
    if (char === '"' || char === "'" || char === '`') {
      let k = i + 1
      while (k < source.length) {
        if (source[k] === '\\') {
          k += 2
          continue
        }
        if (source[k] === char) break
        k += 1
      }
      blankUntil(Math.min(k + 1, source.length), i)
      i = k + 1
      continue
    }
    i += 1
  }

  return out.join('')
}

/**
 * Nom de la fonction dont l'appel englobe la position donnée, ou `null` au niveau racine.
 *
 * @param {string} source Source déjà passée par `blankLiterals`.
 * @param {number} index
 * @returns {string | null}
 */
export function enclosingCallee(source, index) {
  let depth = 0
  for (let i = index - 1; i >= 0; i -= 1) {
    const char = source[i]
    if (char === ')') depth += 1
    else if (char === '(') {
      if (depth === 0) {
        const before = source.slice(0, i)
        const match = before.match(/([A-Za-z_$][\w$]*)\s*$/)
        return match ? match[1] : null
      }
      depth -= 1
    }
  }
  return null
}

const VUE_FILES = listVueFiles(SRC_DIR)

describe('emplacement des appels useHead', () => {
  it('trouve bien des composants à vérifier (garde-fou du test lui-même)', () => {
    const withHead = VUE_FILES.filter((file) => fs.readFileSync(file, 'utf8').includes('useHead('))
    expect(withHead.length).toBeGreaterThan(10)
  })

  it('n’appelle jamais useHead depuis un callback différé', () => {
    const offenders = []

    for (const file of VUE_FILES) {
      const source = blankLiterals(fs.readFileSync(file, 'utf8'))
      for (const match of source.matchAll(/\buseHead\s*\(/g)) {
        const callee = enclosingCallee(source, match.index)
        if (callee && DEFERRED_CALLERS.has(callee)) {
          const line = source.slice(0, match.index).split('\n').length
          offenders.push(`${path.relative(SRC_DIR, file)}:${line} — appelé dans ${callee}()`)
        }
      }
    }

    expect(
      offenders,
      'useHead doit être appelé dans le setup ; passez-lui un computed pour les données async',
    ).toEqual([])
  })
})

describe('helpers du garde-fou', () => {
  it('neutralise parenthèses et guillemets des chaînes et commentaires', () => {
    const blanked = blankLiterals("const a = 'watch(' // watch(\nconst b = 1")
    expect(blanked).not.toContain('watch(')
    expect(blanked).toContain('const a =')
    expect(blanked).toHaveLength("const a = 'watch(' // watch(\nconst b = 1".length)
  })

  it('remonte au bon appelant englobant', () => {
    const src = 'watch([a], () => {\n  useHead({})\n})'
    expect(enclosingCallee(src, src.indexOf('useHead'))).toBe('watch')
  })

  it('ne remonte à rien depuis le niveau racine, même sous un if', () => {
    const src = 'if (seo) {\n  useHead({})\n}'
    expect(enclosingCallee(src, src.indexOf('useHead'))).toBeNull()
  })
})
