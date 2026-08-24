/**
 * Normalisation d’un produit vers le format `items` de GA4 (repris tel quel par Meta via
 * `content_ids`).
 *
 * Trois sources coexistent dans le socle, avec des unités différentes :
 *   - une montre (`transformWatchData`, `services/watchService.js`) — prix en **euros** ;
 *   - une ligne de panier (`CartLine`, `composables/useCart.js`) — prix en **euros** ;
 *   - une ligne de commande (`order_lines`, renvoyée par `verifyOrder`) — prix en **centimes**.
 *
 * D’où deux fonctions distinctes plutôt qu’une devinette sur la forme de l’objet : confondre
 * les deux fausserait le chiffre d’affaires d’un facteur 100.
 */

import { getSiteConfig } from '@/site/getSiteConfig.js'
import { getEffectiveWatchPrice } from '@/utils/watchPricing.js'

/** Devise du site (`checkout.currency`), utilisée par GA4, Ads et Meta. */
export function getCurrency() {
  return getSiteConfig()?.checkout?.currency || 'EUR'
}

/**
 * @param {unknown} cents
 * @returns {number} montant en unité monétaire, arrondi au centime.
 */
export function centsToUnits(cents) {
  const n = Number(cents)
  if (!Number.isFinite(n)) return 0
  return Math.round(n) / 100
}

/** @param {unknown} value */
function toAmount(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

/** @param {unknown} value */
function text(value) {
  if (value === null || value === undefined) return ''
  const s = String(value).trim()
  return s
}

/**
 * Assemble un item en écartant les champs vides : un `item_brand: ''` pollue les rapports
 * autant qu’une valeur fausse.
 */
function buildItem({ id, name, brand, variant, price, quantity, index }) {
  const item = {
    item_id: text(id) || text(name),
    item_name: text(name),
    price: toAmount(price),
    quantity: Math.max(1, Math.floor(Number(quantity) || 1)),
  }
  if (text(brand)) item.item_brand = text(brand)
  if (text(variant)) item.item_variant = text(variant)
  if (Number.isInteger(index)) item.index = index
  return item
}

/**
 * Montre du catalogue ou ligne de panier (prix en euros).
 *
 * `item_id` privilégie la référence : c’est ce que le marchand reconnaît dans ses rapports,
 * là où l’UUID Supabase ne lui parle pas. Repli sur l’identifiant si la référence est absente.
 *
 * @param {Record<string, any>} source
 * @param {{ index?: number, quantity?: number }} [options]
 */
export function toGa4Item(source, options = {}) {
  if (!source) return null

  const isCartLine = 'watchId' in source
  const price = isCartLine ? source.price : getEffectiveWatchPrice(source)

  return buildItem({
    id: source.reference || (isCartLine ? source.watchId : source.id),
    name: source.name,
    brand: source.brand,
    variant: source.model,
    price,
    quantity: options.quantity ?? source.quantity ?? 1,
    index: options.index,
  })
}

/**
 * Ligne de commande côté serveur ou renvoyée par `verifyOrder` (prix en **centimes**,
 * clés en snake_case).
 *
 * @param {Record<string, any>} line
 * @param {{ index?: number }} [options]
 */
export function toGa4ItemFromOrderLine(line, options = {}) {
  if (!line) return null

  return buildItem({
    id: line.reference || line.watch_id || line.watchId,
    name: line.name,
    brand: line.brand,
    variant: line.model,
    price: centsToUnits(line.unit_price_cents ?? line.unitPriceCents),
    quantity: line.quantity,
    index: options.index,
  })
}

/**
 * @param {Record<string, any>[]} sources
 * @param {(source: any, options: { index: number }) => Record<string, any> | null} [mapper]
 */
export function toGa4Items(sources, mapper = toGa4Item) {
  if (!Array.isArray(sources)) return []
  return sources.map((source, index) => mapper(source, { index })).filter(Boolean)
}

/**
 * Valeur totale d’une liste d’items, quand l’appelant n’a pas déjà un total faisant foi.
 * @param {Record<string, any>[]} items
 */
export function sumItemsValue(items) {
  if (!Array.isArray(items)) return 0
  const total = items.reduce((sum, item) => sum + toAmount(item.price) * (item.quantity || 1), 0)
  return Math.round(total * 100) / 100
}

/**
 * Identifiants produits attendus par Meta (`content_ids`).
 * @param {Record<string, any>[]} items
 */
export function toMetaContentIds(items) {
  if (!Array.isArray(items)) return []
  return items.map((item) => item.item_id).filter(Boolean)
}

/**
 * Contenus détaillés attendus par Meta (`contents`), qui porte les quantités.
 * @param {Record<string, any>[]} items
 */
export function toMetaContents(items) {
  if (!Array.isArray(items)) return []
  return items.map((item) => ({
    id: item.item_id,
    quantity: item.quantity || 1,
    item_price: item.price,
  }))
}
