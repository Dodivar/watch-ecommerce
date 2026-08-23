/**
 * Seed un catalogue de démonstration volumineux, pour mesurer le listing public sur un
 * volume revendeur (~3 000 références) au lieu de l'affirmer.
 *
 * Toutes les lignes créées portent le préfixe `DEMO-SEED-` sur `ad_code` **et** sur `slug` :
 * c'est la seule chose qui les distingue du vrai catalogue, et donc la seule chose sur
 * laquelle `--cleanup` s'appuie. Aucune ligne sans ce préfixe n'est jamais touchée.
 *
 * ⚠️ Le projet Supabase n'a pas de notion de site : les montres seedées apparaissent sur le
 * site public du projet visé. À ne pointer que sur un projet / une branche de test.
 *
 * Prérequis (.env à la racine du monorepo) :
 *   VITE_SUPABASE_URL=...          (ou SUPABASE_URL, ou --url=...)
 *   SUPABASE_SERVICE_ROLE_KEY=...  (ou --key=...)
 *
 * Usage :
 *   node scripts/seed-demo-catalog.mjs                    # aperçu (dry-run), 3000 montres
 *   node scripts/seed-demo-catalog.mjs --count=500        # autre volume
 *   node scripts/seed-demo-catalog.mjs --apply            # écriture en base
 *   node scripts/seed-demo-catalog.mjs --cleanup --apply  # suppression des lignes seedées
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env') })

const LOG = '[seed-demo-catalog]'

/** Marqueur des lignes de démonstration. Ne jamais le changer sans nettoyer avant. */
const SEED_PREFIX = 'DEMO-SEED-'

/** Lignes par insert : au-delà, la requête PostgREST devient inutilement lourde. */
const INSERT_BATCH_SIZE = 500

/** @param {string} name @returns {string | null} */
function readFlag(name) {
  const match = process.argv.find((arg) => arg.startsWith(`--${name}=`))
  return match ? match.slice(name.length + 3) : null
}

const apply = process.argv.includes('--apply')
const cleanup = process.argv.includes('--cleanup')
const count = Number(readFlag('count') ?? 3000)

const supabaseUrl = readFlag('url') || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const serviceRoleKey = readFlag('key') || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    `${LOG} Définir VITE_SUPABASE_URL (ou SUPABASE_URL) et SUPABASE_SERVICE_ROLE_KEY dans .env,`,
  )
  console.error(`${LOG} ou passer --url=... --key=...`)
  process.exit(1)
}

if (!Number.isInteger(count) || count < 1 || count > 20000) {
  console.error(`${LOG} --count doit être un entier entre 1 et 20000 (reçu : ${count})`)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

console.log(`${LOG} cible : ${new URL(supabaseUrl).host}`)
console.log(`${LOG} mode  : ${cleanup ? 'nettoyage' : `seed ${count} montres`}${apply ? '' : ' (dry-run)'}`)

// ---------------------------------------------------------------------------
// Nettoyage
// ---------------------------------------------------------------------------

/**
 * Supprime les seules lignes marquées. Les relations partent en cascade côté base ;
 * on les supprime tout de même explicitement pour rester correct si la cascade manque.
 */
async function runCleanup() {
  const { data: seeded, error } = await supabase
    .from('watches')
    .select('id')
    .like('ad_code', `${SEED_PREFIX}%`)

  if (error) {
    console.error(`${LOG} Lecture impossible :`, error.message)
    process.exit(1)
  }

  const ids = (seeded ?? []).map((row) => row.id)
  console.log(`${LOG} ${ids.length} montre(s) de démonstration en base`)

  if (!apply || ids.length === 0) {
    if (!apply) console.log(`${LOG} dry-run : relancer avec --cleanup --apply pour supprimer`)
    return
  }

  for (let index = 0; index < ids.length; index += INSERT_BATCH_SIZE) {
    const chunk = ids.slice(index, index + INSERT_BATCH_SIZE)
    for (const table of ['watch_images', 'watch_accessories', 'watch_details']) {
      const { error: relationError } = await supabase.from(table).delete().in('watch_id', chunk)
      if (relationError) {
        console.error(`${LOG} Suppression ${table} impossible :`, relationError.message)
        process.exit(1)
      }
    }
    const { error: watchError } = await supabase.from('watches').delete().in('id', chunk)
    if (watchError) {
      console.error(`${LOG} Suppression watches impossible :`, watchError.message)
      process.exit(1)
    }
    console.log(`${LOG} supprimé ${Math.min(index + chunk.length, ids.length)}/${ids.length}`)
  }
}

// ---------------------------------------------------------------------------
// Génération
// ---------------------------------------------------------------------------

const BRANDS = [
  ['Rolex', ['Submariner', 'Datejust', 'GMT-Master II', 'Daytona', 'Explorer']],
  ['Omega', ['Speedmaster', 'Seamaster', 'Constellation', 'De Ville']],
  ['Tudor', ['Black Bay', 'Pelagos', 'Ranger']],
  ['Cartier', ['Santos', 'Tank', 'Ballon Bleu']],
  ['Breitling', ['Navitimer', 'Superocean', 'Chronomat']],
  ['TAG Heuer', ['Carrera', 'Monaco', 'Aquaracer']],
  ['IWC', ['Portugieser', 'Pilot', 'Portofino']],
  ['Longines', ['Master Collection', 'HydroConquest', 'Spirit']],
  ['Tissot', ['PRX', 'Seastar', 'Le Locle']],
  ['Panerai', ['Luminor', 'Radiomir', 'Submersible']],
]

const AUDIENCES = ['homme', 'homme', 'homme', 'femme', 'femme', 'unisexe']
const CASE_SIZES = ['36', '38', '39', '40', '41', '42', '44']
const BRACELET_COLORS = ['gold', 'silver', 'black', 'rose_gold', 'bronze', 'blue']
const BRACELET_MATERIALS = ['steel', 'gold', 'leather', 'rubber', 'titanium', 'ceramic', 'fabric']
const CONDITIONS = ['Neuf', 'Très bon état', 'Bon état', 'État correct']
const ACCESSORIES = ['Boîte', 'Papiers', 'Carte de garantie', 'Maillons supplémentaires']

/** Générateur pseudo-aléatoire déterministe : deux exécutions produisent le même catalogue. */
function createRandom(seed) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

/** @template T @param {() => number} random @param {T[]} list @returns {T} */
function pick(random, list) {
  return list[Math.floor(random() * list.length)]
}

/**
 * URLs d'images réelles du catalogue, réutilisées telles quelles : le poids et le rendu
 * mesurés correspondent alors à ce qu'un vrai import produirait.
 * @returns {Promise<string[]>}
 */
async function loadSampleImageUrls() {
  const { data, error } = await supabase
    .from('watch_images')
    .select('image_url')
    .not('image_url', 'is', null)
    .limit(200)

  if (error) {
    console.error(`${LOG} Lecture des images impossible :`, error.message)
    process.exit(1)
  }

  const urls = (data ?? []).map((row) => row.image_url).filter(Boolean)
  if (urls.length === 0) {
    console.warn(`${LOG} Aucune image réelle en base : les cartes seedées seront sans visuel.`)
  }
  return urls
}

/** @param {number} index @param {() => number} random @param {string[]} imageUrls */
function buildWatch(index, random, imageUrls) {
  const [brand, models] = pick(random, BRANDS)
  const model = pick(random, models)
  const reference = `${brand.slice(0, 2).toUpperCase()}${1000 + Math.floor(random() * 8999)}`
  const suffix = String(index).padStart(5, '0')
  const price = 800 + Math.floor(random() * 40000)
  const onPromotion = random() < 0.12

  return {
    watch: {
      ad_code: `${SEED_PREFIX}${suffix}`,
      slug: `${SEED_PREFIX.toLowerCase()}${suffix}-${brand.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: `${brand} ${model}`,
      brand,
      model,
      reference,
      price,
      promotion_price: onPromotion ? Math.round(price * 0.85) : null,
      year: 1990 + Math.floor(random() * 35),
      condition: pick(random, CONDITIONS),
      description: `${brand} ${model} référence ${reference}, révisée et prête à porter. Montre de démonstration générée pour test de charge.`,
      is_available: true,
      is_sold: false,
      audience: pick(random, AUDIENCES),
      stock_quantity: 1,
      display_order: index,
    },
    details: {
      movement: random() < 0.8 ? 'Automatique' : 'Quartz',
      case_material: pick(random, ['Acier', 'Or', 'Titane', 'Céramique']),
      case_size: pick(random, CASE_SIZES),
      dial_color: pick(random, ['Noir', 'Blanc', 'Bleu', 'Argenté', 'Vert']),
      crystal: 'Saphir',
      water_resistance: `${pick(random, [30, 50, 100, 200, 300])} m`,
      power_reserve: `${38 + Math.floor(random() * 32)} h`,
      case_condition: pick(random, CONDITIONS),
      dial_condition: pick(random, CONDITIONS),
      bracelet_condition: pick(random, CONDITIONS),
      guarantee: '12 mois',
      bracelet_colors: [pick(random, BRACELET_COLORS)],
      bracelet_materials: [pick(random, BRACELET_MATERIALS)],
    },
    imageCount: imageUrls.length === 0 ? 0 : 2 + Math.floor(random() * 4),
    accessoryCount: Math.floor(random() * 3),
  }
}

async function runSeed() {
  const { count: existing, error: countError } = await supabase
    .from('watches')
    .select('id', { count: 'exact', head: true })
    .like('ad_code', `${SEED_PREFIX}%`)

  if (countError) {
    console.error(`${LOG} Lecture impossible :`, countError.message)
    process.exit(1)
  }

  if (existing > 0) {
    console.error(`${LOG} ${existing} montre(s) de démonstration déjà en base.`)
    console.error(`${LOG} Lancer d'abord : node scripts/seed-demo-catalog.mjs --cleanup --apply`)
    process.exit(1)
  }

  const imageUrls = await loadSampleImageUrls()
  const random = createRandom(20260819)
  const specs = Array.from({ length: count }, (_, index) => buildWatch(index, random, imageUrls))

  const totalImages = specs.reduce((sum, spec) => sum + spec.imageCount, 0)
  const totalAccessories = specs.reduce((sum, spec) => sum + spec.accessoryCount, 0)

  console.log(`${LOG} à créer : ${count} montres, ${count} détails, ${totalImages} images, ${totalAccessories} accessoires`)

  if (!apply) {
    console.log(`${LOG} exemple :`, JSON.stringify(specs[0].watch, null, 2))
    console.log(`${LOG} dry-run : relancer avec --apply pour écrire`)
    return
  }

  for (let index = 0; index < specs.length; index += INSERT_BATCH_SIZE) {
    const chunk = specs.slice(index, index + INSERT_BATCH_SIZE)

    const { data: inserted, error: watchError } = await supabase
      .from('watches')
      .insert(chunk.map((spec) => spec.watch))
      .select('id, ad_code')

    if (watchError) {
      console.error(`${LOG} Insertion watches impossible :`, watchError.message)
      process.exit(1)
    }

    const idByAdCode = new Map((inserted ?? []).map((row) => [row.ad_code, row.id]))

    const details = []
    const images = []
    const accessories = []

    for (const spec of chunk) {
      const watchId = idByAdCode.get(spec.watch.ad_code)
      if (!watchId) continue

      details.push({ watch_id: watchId, ...spec.details })

      for (let order = 0; order < spec.imageCount; order += 1) {
        images.push({
          watch_id: watchId,
          image_url: imageUrls[(order + index) % imageUrls.length],
          image_order: order,
        })
      }

      for (let position = 0; position < spec.accessoryCount; position += 1) {
        accessories.push({
          watch_id: watchId,
          name: ACCESSORIES[position % ACCESSORIES.length],
          included: true,
        })
      }
    }

    for (const [table, rows] of [
      ['watch_details', details],
      ['watch_images', images],
      ['watch_accessories', accessories],
    ]) {
      if (rows.length === 0) continue
      const { error: relationError } = await supabase.from(table).insert(rows)
      if (relationError) {
        console.error(`${LOG} Insertion ${table} impossible :`, relationError.message)
        process.exit(1)
      }
    }

    console.log(`${LOG} inséré ${Math.min(index + chunk.length, specs.length)}/${specs.length}`)
  }

  console.log(`${LOG} terminé. Nettoyage : node scripts/seed-demo-catalog.mjs --cleanup --apply`)
}

if (cleanup) {
  await runCleanup()
} else {
  await runSeed()
}
