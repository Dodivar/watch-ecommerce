/**
 * Import ponctuel d'une référence PrestaShop (Place des Montres) vers Supabase.
 *
 * Produit source : http://www.placedesmontres.fr/montre-homme/10526-orient-ra-ac0m03s.html
 *
 * Écrit `watches` + `watch_details` + `watch_accessories`, puis téléverse le
 * visuel ré-encodé en WebP dans le bucket `watch-images` et enregistre la ligne
 * `watch_images`. Mêmes conventions que `scripts/prestashop-import/` : nom de
 * fichier horodaté, `cache-control` d'un an, chemin `watches/<id>/<fichier>`.
 *
 * Le pipeline CSV complet n'est pas utilisable ici : `recordToDbPayloads` place
 * systématiquement `prestashop_product_id` dans le payload d'insertion, colonne
 * absente de la base tant que `prestashop_product_id.sql.example` n'est pas
 * appliqué. Pour une référence unique, l'écriture directe est plus courte que la
 * reconstitution d'un CSV PrestaShop.
 *
 * Prérequis (.env à la racine du monorepo) :
 *   VITE_SUPABASE_URL=https://xxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...
 *
 * Usage :
 *   node scripts/import-orient-ra-ac0m03s.mjs --image <chemin.webp>            # dry-run
 *   node scripts/import-orient-ra-ac0m03s.mjs --image <chemin.webp> --apply    # écrit
 *   node scripts/import-orient-ra-ac0m03s.mjs --cleanup                        # supprime
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  STORAGE_IMAGE_CACHE_CONTROL,
  UPLOAD_IMAGE_MIME,
  buildUploadFileName,
} from '../packages/base/src/utils/imageEncoding.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: resolve(__dirname, '../.env') })

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const cleanup = args.includes('--cleanup')
const imageArgIndex = args.indexOf('--image')
const imageFile = imageArgIndex >= 0 ? resolve(args[imageArgIndex + 1]) : null

const SOURCE_URL = 'http://www.placedesmontres.fr/montre-homme/10526-orient-ra-ac0m03s.html'

/** Référence PrestaShop (colonne « Référence ») → clé de déduplication. */
const AD_CODE = 'S30M0CA-AREIRO'

const watch = {
  ad_code: AD_CODE,
  name: 'ORIENT RA-AC0M03S',
  brand: 'ORIENT',
  model: 'Bambino 38 mm',
  reference: 'RA-AC0M03S',
  price: 299,
  year: null,
  condition: 'Neuf',
  description:
    'Montre ORIENT référence RA-AC0M03S. Dans la collection BAMBINO 38mm de la marque ORIENT. ' +
    'Mouvement automatique Orient F6724. Verre minéral bombé et son bracelet cuir.',
  // Masquée volontairement : la cible est la prod Sauvage watches, pas un projet
  // Place des Montres. `is_available = false` sort la montre du listing public et
  // de la fiche (watchService.js), tout en la laissant visible dans l'admin.
  is_available: false,
  is_sold: false,
  audience: 'homme',
  stock_quantity: 1,
}

const details = {
  content: [
    'Style : Classique.',
    'Mécanisme : Automatique mécanique.',
    'Bracelet en cuir.',
    'Couleur du cadran : Blanc.',
    'Affichage de type : Analogique.',
    'Étanchéité 3 ATM (lavage de mains).',
    'Fonctions : Heure et Date.',
    'Diamètre ou largeur : 38,40 mm.',
  ].join('\n'),
  movement: 'Automatique mécanique (calibre Orient F6724)',
  case_material: null,
  bracelet_materials: ['leather'], // normalizeBraceletMaterials(['Cuir'])
  case_size: '38.4', // normalizeCaseSizeValue('38,40 mm')
  thickness: null,
  dial_color: 'Blanc',
  crystal: 'Minéral bombé',
  water_resistance: '3 ATM (lavage de mains)',
  functions: 'Heure et Date',
  power_reserve: null,
  frequency: null,
  case_condition: null,
  dial_condition: null,
  bracelet_condition: null,
  guarantee: '2 ans de garantie', // mention portée par les fiches placedesmontres.fr
}

/** La fiche source n'annonce ni boîte ni papiers pour cette référence. */
const accessories = []

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if ((apply || cleanup) && (!supabaseUrl || !serviceRoleKey)) {
  console.error('Définir VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env')
  process.exit(1)
}

if (apply && (!imageFile || !existsSync(imageFile))) {
  console.error('Passer --image <chemin vers le .webp> pour le mode --apply')
  process.exit(1)
}

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
    : null

async function findExisting() {
  const { data, error } = await supabase
    .from('watches')
    .select('id, ad_code, name')
    .eq('ad_code', AD_CODE)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ?? null
}

async function doCleanup() {
  const existing = await findExisting()
  if (!existing) {
    console.log(`Rien à supprimer (ad_code ${AD_CODE} absent).`)
    return
  }

  const { data: images } = await supabase
    .from('watch_images')
    .select('image_path')
    .eq('watch_id', existing.id)

  const paths = (images ?? []).map((i) => i.image_path).filter(Boolean)
  if (paths.length) {
    await supabase.storage.from('watch-images').remove(paths)
    console.log(`Storage : ${paths.length} objet(s) supprimé(s).`)
  }

  // Suppression explicite des tables filles : ne pas dépendre du ON DELETE CASCADE.
  await supabase.from('watch_images').delete().eq('watch_id', existing.id)
  await supabase.from('watch_accessories').delete().eq('watch_id', existing.id)
  await supabase.from('watch_details').delete().eq('watch_id', existing.id)
  const { error } = await supabase.from('watches').delete().eq('id', existing.id)
  if (error) throw new Error(error.message)

  console.log(`Supprimé : ${existing.name} (${existing.id}).`)
}

async function nextDisplayOrder() {
  const { data } = await supabase
    .from('watches')
    .select('display_order')
    // `nullsFirst: false` est indispensable : en tri décroissant Postgres place
    // les NULL en tête, et la moitié du catalogue a un `display_order` nul. Sans
    // ça la requête ramène une ligne NULL et le prochain rang repart à 1.
    .order('display_order', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  return (data?.display_order ?? 0) + 1
}

/**
 * Téléverse le visuel et enregistre la ligne `watch_images`.
 *
 * Étape isolée parce qu'elle est la seule à exiger la clé service_role : les
 * lignes SQL peuvent être posées sans elle, l'upload Storage non. Le script
 * reste donc rejouable pour finir une montre déjà insérée mais sans image.
 *
 * @param {string} watchId
 */
async function importImage(watchId) {
  const buffer = readFileSync(imageFile)
  const filePath = `watches/${watchId}/${buildUploadFileName()}`

  const { error: uploadError } = await supabase.storage
    .from('watch-images')
    .upload(filePath, buffer, {
      cacheControl: STORAGE_IMAGE_CACHE_CONTROL,
      upsert: false,
      contentType: UPLOAD_IMAGE_MIME,
    })
  if (uploadError) throw new Error(`Upload image : ${uploadError.message}`)

  const {
    data: { publicUrl },
  } = supabase.storage.from('watch-images').getPublicUrl(filePath)

  const { error: imageError } = await supabase.from('watch_images').insert({
    watch_id: watchId,
    image_path: filePath,
    image_url: publicUrl,
    image_order: 1,
  })
  if (imageError) {
    await supabase.storage.from('watch-images').remove([filePath])
    throw new Error(`watch_images : ${imageError.message}`)
  }

  console.log(`watch_images : ${publicUrl}`)
}

async function doImport() {
  const existing = await findExisting()
  if (existing) {
    const { count } = await supabase
      .from('watch_images')
      .select('id', { count: 'exact', head: true })
      .eq('watch_id', existing.id)

    if (count) {
      console.log(`Déjà présent avec ${count} image(s) : ${existing.name} (${existing.id}).`)
      return
    }

    console.log(`Montre déjà insérée sans image : ${existing.id} — upload du visuel.`)
    await importImage(existing.id)
    console.log('Terminé.')
    return
  }

  const display_order = await nextDisplayOrder()

  const { data: inserted, error: insertError } = await supabase
    .from('watches')
    .insert({ ...watch, display_order })
    .select('id, slug')
    .single()

  if (insertError) throw new Error(`Insertion montre : ${insertError.message}`)
  const watchId = inserted.id
  console.log(`watches : créée ${watchId} (slug ${inserted.slug}, display_order ${display_order}).`)

  const { error: detailsError } = await supabase
    .from('watch_details')
    .insert({ ...details, watch_id: watchId })
  if (detailsError) throw new Error(`Détails : ${detailsError.message}`)
  console.log('watch_details : créés.')

  if (accessories.length) {
    const { error } = await supabase
      .from('watch_accessories')
      .insert(accessories.map((a) => ({ ...a, watch_id: watchId })))
    if (error) throw new Error(`Accessoires : ${error.message}`)
    console.log(`watch_accessories : ${accessories.length} ligne(s).`)
  }

  await importImage(watchId)
  console.log('Terminé.')
}

if (cleanup) {
  await doCleanup()
} else if (apply) {
  await doImport()
} else {
  console.log(`[dry-run] source : ${SOURCE_URL}`)
  console.log(`[dry-run] cible  : ${supabaseUrl ?? '(VITE_SUPABASE_URL absent)'}`)
  console.log(
    `[dry-run] image  : ${
      imageFile && existsSync(imageFile)
        ? `${imageFile} (${readFileSync(imageFile).length} octets)`
        : '(aucune — passer --image)'
    }`,
  )
  console.log('[dry-run] watches :', JSON.stringify(watch, null, 2))
  console.log('[dry-run] watch_details :', JSON.stringify(details, null, 2))
  console.log('[dry-run] watch_accessories :', JSON.stringify(accessories))
  console.log('\nRelancer avec --apply pour écrire.')
}
