import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { loadMapping } from '../../../scripts/prestashop-import/loadMapping.js'
import { parseImagesCsv } from '../../../scripts/prestashop-import/parseImagesCsv.js'
import {
  parseFeatureBundle,
  parsePrestashopFeaturesStrict,
} from '../../../scripts/prestashop-import/parsePrestashopFeatures.js'
import { parsePrestashopCsv } from '../../../scripts/prestashop-import/parsePrestashopCsv.js'
import { transformPrestashopRow } from '../../../scripts/prestashop-import/transformPrestashopRow.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixturesDir = resolve(__dirname, '../../fixtures/prestashop')

describe('parsePrestashopFeaturesStrict', () => {
  it('parse une feature simple name:value:position:customized', () => {
    const result = parsePrestashopFeaturesStrict('Modèle:Submariner:1:0,Mouvement:Automatique:2:0')
    expect(result).toEqual({
      Modèle: 'Submariner',
      Mouvement: 'Automatique',
    })
  })

  it('parse une valeur contenant des deux-points', () => {
    const parsed = parseFeatureBundle('Note:Ratio 1:2:3:4:0')
    expect(parsed).toEqual({ name: 'Note', value: 'Ratio 1:2:3' })
  })
})

describe('parsePrestashopCsv', () => {
  it('parse le CSV sample avec guillemets et point-virgule', () => {
    const content = readFileSync(resolve(fixturesDir, 'products-sample.csv'), 'utf8')
    const { headers, rows } = parsePrestashopCsv(content)
    expect(headers).toContain('ID')
    expect(headers).toContain('Nom')
    expect(rows).toHaveLength(3)
    expect(rows[0].ID).toBe('1001')
    expect(rows[0].Nom).toBe('Rolex Submariner Date')
  })
})

describe('parseImagesCsv', () => {
  it('indexe les images par id_product', () => {
    const content = readFileSync(resolve(fixturesDir, 'images-sample.csv'), 'utf8')
    const map = parseImagesCsv(content)
    expect(map.get('1001')).toHaveLength(2)
    expect(map.get('1001')[0].url).toContain('submariner-1')
    expect(map.get('1002')).toHaveLength(1)
  })
})

describe('transformPrestashopRow', () => {
  const mapping = loadMapping(resolve(__dirname, '../../../sites/_template/prestashop-import.mapping.json'))

  it('transforme une ligne valide avec features et audience', () => {
    const content = readFileSync(resolve(fixturesDir, 'products-sample.csv'), 'utf8')
    const { rows } = parsePrestashopCsv(content)

    const { record, error } = transformPrestashopRow(rows[0], mapping, {
      imageUrls: ['https://example.com/img.jpg'],
    })

    expect(error).toBeUndefined()
    expect(record).toMatchObject({
      prestashopProductId: '1001',
      adCode: 'PS-REF-001',
      name: 'Rolex Submariner Date',
      brand: 'Rolex',
      model: 'Submariner Date',
      reference: '126610LN',
      price: 8950,
      audience: 'homme',
      isAvailable: true,
    })
    expect(record.details.movement).toBe('Automatique')
    expect(record.details.caseSize).toBe('41')
    expect(record.accessories).toContainEqual({ name: 'Boîte', included: true })
    expect(record.imageUrls).toContain('https://example.com/img.jpg')
  })

  it('rejette une ligne sans prix valide', () => {
    const content = readFileSync(resolve(fixturesDir, 'products-sample.csv'), 'utf8')
    const { rows } = parsePrestashopCsv(content)

    const { error } = transformPrestashopRow(rows[2], mapping)
    expect(error).toMatch(/Prix invalide/)
  })

  it('génère ad_code depuis prestashopId si référence absente', () => {
    const mappingNoPrefix = {
      ...mapping,
      adCode: { from: 'reference', fallback: 'prestashopId', prefix: 'PS-' },
    }

    const row = {
      ID: '9999',
      Référence: '',
      Nom: 'Test Watch',
      Fabricant: 'Brand X',
      'Prix TTC': '1500',
      Actif: '1',
    }

    const { record } = transformPrestashopRow(row, mappingNoPrefix)
    expect(record.adCode).toBe('PS-9999')
  })
})
