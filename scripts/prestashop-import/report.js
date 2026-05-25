import { writeFileSync } from 'node:fs'

/**
 * @typedef {'created' | 'updated' | 'skipped' | 'error'} ImportResultStatus
 */

/**
 * @typedef {Object} ImportResultEntry
 * @property {string} prestashopProductId
 * @property {string} adCode
 * @property {string} name
 * @property {ImportResultStatus} status
 * @property {string} [watchId]
 * @property {string} [message]
 * @property {number} [imagesImported]
 * @property {number} [imagesFailed]
 */

export class ImportReport {
  constructor() {
    /** @type {ImportResultEntry[]} */
    this.entries = []
    this.startedAt = new Date().toISOString()
    this.finishedAt = null
  }

  /**
   * @param {ImportResultEntry} entry
   */
  add(entry) {
    this.entries.push(entry)
  }

  /**
   * @returns {{ created: number, updated: number, skipped: number, error: number, total: number }}
   */
  summary() {
    const counts = { created: 0, updated: 0, skipped: 0, error: 0, total: this.entries.length }
    for (const entry of this.entries) {
      counts[entry.status] += 1
    }
    return counts
  }

  finish() {
    this.finishedAt = new Date().toISOString()
  }

  /**
   * @param {string} [filePath]
   */
  printConsole(filePath) {
    const s = this.summary()
    console.log('\n[prestashop-import] Résumé')
    console.log(`  Créés    : ${s.created}`)
    console.log(`  Mis à jour : ${s.updated}`)
    console.log(`  Ignorés  : ${s.skipped}`)
    console.log(`  Erreurs  : ${s.error}`)
    console.log(`  Total    : ${s.total}`)

    const errors = this.entries.filter((e) => e.status === 'error')
    if (errors.length > 0) {
      console.log('\n[prestashop-import] Erreurs (max 20) :')
      for (const e of errors.slice(0, 20)) {
        console.log(`  • ${e.prestashopProductId || e.adCode} — ${e.message}`)
      }
      if (errors.length > 20) {
        console.log(`  … et ${errors.length - 20} autre(s)`)
      }
    }

    if (filePath) {
      this.writeJson(filePath)
      console.log(`\n[prestashop-import] Rapport JSON : ${filePath}`)
    }
  }

  /**
   * @param {string} filePath
   */
  writeJson(filePath) {
    this.finish()
    writeFileSync(
      filePath,
      JSON.stringify(
        {
          startedAt: this.startedAt,
          finishedAt: this.finishedAt,
          summary: this.summary(),
          entries: this.entries,
        },
        null,
        2,
      ),
      'utf8',
    )
  }
}
