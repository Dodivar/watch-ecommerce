/**
 * Toute clé `t('…')` utilisée dans un composant doit exister dans le catalogue.
 *
 * `messages.test.js` garantit que les trois langues restent alignées entre elles ; ce test-ci
 * garantit qu'elles couvrent ce que l'interface demande réellement. Sans lui, une clé mal
 * orthographiée ou supprimée s'affiche telle quelle dans la page — visible seulement à l'œil.
 *
 * Le sens inverse compte autant : une clé traduite dans les trois langues mais que plus aucun
 * composant n'appelle signale presque toujours un texte resté codé en dur à côté. C'est ainsi
 * que « Préférences cookies » est resté français alors que sa traduction existait.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { MESSAGE_CATALOGS } from './index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC_DIR = path.resolve(__dirname, '../..')

/** @param {string} dir @returns {string[]} */
function listSourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return listSourceFiles(full)
    return /\.(vue|js)$/.test(entry.name) && !entry.name.endsWith('.test.js') ? [full] : []
  })
}

/** Clés littérales `t('x.y')` / `tc('x.y', …)`. Les clés calculées ne sont pas détectables ici. */
function collectUsedKeys() {
  const used = new Map()
  for (const file of listSourceFiles(SRC_DIR)) {
    const content = fs.readFileSync(file, 'utf8')
    for (const match of content.matchAll(/\bt[c]?\(\s*'([a-zA-Z]+\.[a-zA-Z0-9.]+)'/g)) {
      if (!used.has(match[1])) used.set(match[1], path.relative(SRC_DIR, file))
    }
  }
  return used
}

/** Fichiers du socle hors catalogue : `fr.js` citerait sinon chacune de ses propres cles. */
function listConsumerFiles() {
  const catalogDir = path.join(SRC_DIR, 'i18n', 'messages')
  return listSourceFiles(SRC_DIR).filter((file) => !file.startsWith(catalogDir))
}

/**
 * Toute chaine ressemblant a une cle, `t('...')` ou non : les liens legaux passent par
 * `labelKey: 'legal.mentions'`, qu'une detection limitee a `t(` classerait a tort orpheline.
 */
function collectReferencedKeys() {
  const referenced = new Set()
  for (const file of listConsumerFiles()) {
    const content = fs.readFileSync(file, 'utf8')
    for (const match of content.matchAll(/'([a-zA-Z]+[.][a-zA-Z0-9.]+)'/g)) referenced.add(match[1])
  }
  return referenced
}

describe('couverture du catalogue', () => {
  it('définit toutes les clés utilisées par les composants', () => {
    const known = new Set(Object.keys(MESSAGE_CATALOGS.fr))
    const missing = [...collectUsedKeys()]
      .filter(([key]) => !known.has(key))
      .map(([key, file]) => `${key} (${file})`)
    expect(missing).toEqual([])
  })

  it("ne garde aucune clé que plus personne n'appelle", () => {
    const referenced = collectReferencedKeys()
    const orphans = Object.keys(MESSAGE_CATALOGS.fr).filter((key) => !referenced.has(key))
    expect(orphans).toEqual([])
  })

  it('trouve bien des clés à vérifier (garde-fou du test lui-même)', () => {
    // Si la détection casse, le test précédent passerait toujours pour de mauvaises raisons.
    expect(collectUsedKeys().size).toBeGreaterThan(20)
  })
})
