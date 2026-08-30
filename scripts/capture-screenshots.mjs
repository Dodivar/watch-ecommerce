/**
 * Captures de référence d'une vitrine — pour documenter le rendu et le rendre
 * lisible hors du navigateur (revues, supports commerciaux, agents).
 *
 * Lance un serveur Vite pour `SITE_ID`, parcourt une liste de routes en desktop
 * et en mobile, écrit des JPEG dans `documentation/screenshots/<site-id>/`.
 *
 *   SITE_ID=sauvage-watches node scripts/capture-screenshots.mjs
 *   npm run screenshots:place
 *
 * Options :
 *   --routes=/,/collection      routes à capturer (défaut : liste ci-dessous)
 *   --viewports=desktop,mobile  cibles (défaut : les deux)
 *   --port=5199                 port du serveur de dev
 *   --out=chemin                dossier de sortie
 *   --quality=75                qualité JPEG
 *   --locale=fr-FR              langue annoncée par le navigateur
 *   --keep-server               réutilise un serveur déjà lancé sur le port
 *
 * Le contenu vient de Supabase : sans `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
 * valides, les pages se rendent dans leur état vide. Lancer ce script depuis un
 * poste disposant du `.env` du client pour des captures représentatives.
 */
/* global window, document -- les callbacks de page.evaluate / addInitScript sont
   sérialisés puis exécutés dans le navigateur, pas dans Node. */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

import { chromium } from '@playwright/test'

import { REPO_ROOT, getSiteId } from '../vite/resolve-site.mjs'

const DEFAULT_ROUTES = ['/', '/collection', '/blog', '/estimation', '/contact']

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1 },
  mobile: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
}

function parseArgs(argv) {
  const args = {}
  for (const raw of argv.slice(2)) {
    const match = /^--([a-z-]+)(?:=(.*))?$/.exec(raw)
    if (!match) continue
    args[match[1]] = match[2] ?? 'true'
  }
  return args
}

/** `/collection/ma-montre` → `collection-ma-montre` ; `/` → `accueil`. */
function routeToSlug(route) {
  const clean = route.replace(/^\/+|\/+$/g, '')
  return clean === '' ? 'accueil' : clean.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
}

/**
 * Accepte le bandeau cookies s'il est affiché. La clé de stockage du consentement
 * est propre à chaque client (`integrations.cookieConsentStorageKey`) : cliquer
 * est plus robuste que de deviner la clé.
 */
async function dismissCookieBanner(page) {
  const button = page
    .getByRole('button', { name: /tout accepter|accepter tout|accept all/i })
    .first()
  try {
    await button.click({ timeout: 2500 })
    await page.waitForTimeout(400)
  } catch {
    // Pas de bandeau (choix déjà mémorisé dans le contexte) : rien à faire.
  }
}

/**
 * Neutralise `position: fixed` / `sticky` avant une capture pleine page.
 * Chromium redimensionne la fenêtre pour capturer toute la hauteur : un en-tête
 * collant se retrouve alors dessiné au milieu de l'image, là où il « collait ».
 * Chaque élément concerné est repositionné en haut du document.
 */
async function freezeStickyElements(page) {
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('body *')) {
      const position = window.getComputedStyle(el).position
      if (position !== 'fixed' && position !== 'sticky') continue
      el.style.position = 'absolute'
      el.style.top = '0px'
    }
  })
  await page.waitForTimeout(200)
}

async function waitForServer(url, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { method: 'GET' })
      if (res.ok) return
    } catch {
      // serveur pas encore prêt
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`Le serveur de dev n'a pas répondu sur ${url} en ${timeoutMs / 1000}s.`)
}

function startDevServer(siteId, port) {
  // Binaire local plutôt que `npx` : sur un cache npm froid, `npx` peut partir
  // en résolution réseau et ne jamais rendre la main.
  const bin = path.join(
    REPO_ROOT,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'vite.cmd' : 'vite',
  )
  if (!fs.existsSync(bin)) {
    throw new Error(`Vite introuvable (${bin}) — lancer \`npm install\` d'abord.`)
  }

  // `services/supabase.js` lève au chargement si ces variables manquent : sans
  // elles l'application ne monte pas du tout et la capture est une page vide.
  // Des valeurs factices laissent le rendu se faire, avec des états vides.
  const hasRealSupabase = Boolean(
    process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY,
  )
  if (!hasRealSupabase) {
    console.warn(
      '[screenshots] VITE_SUPABASE_* absentes : repli sur des valeurs factices. Le rendu sera ' +
        "celui des états vides (pas de montres, pas d'articles). Relancer depuis un poste " +
        'disposant du .env du client pour des captures représentatives.',
    )
  }

  const child = spawn(
    bin,
    ['--config', 'vite/vite.config.mjs', '--port', String(port), '--strictPort'],
    {
      cwd: REPO_ROOT,
      env: {
        ...process.env,
        SITE_ID: siteId,
        VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://stub.supabase.test',
        VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'screenshot-anon-key',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    },
  )
  child.stdout.on('data', () => {})
  child.stderr.on('data', (chunk) => process.stderr.write(`[vite] ${chunk}`))
  child.on('error', (err) => {
    console.error(`[screenshots] Impossible de lancer Vite : ${err.message}`)
  })
  return child
}

async function main() {
  const args = parseArgs(process.argv)
  const siteId = getSiteId()
  const port = Number(args.port || 5199)
  const quality = Number(args.quality || 75)
  const locale = args.locale || 'fr-FR'
  const baseUrl = `http://localhost:${port}`

  const routes = args.routes ? args.routes.split(',').filter(Boolean) : DEFAULT_ROUTES
  const viewportNames = (args.viewports ? args.viewports.split(',') : Object.keys(VIEWPORTS))
    .map((name) => name.trim())
    .filter((name) => {
      if (VIEWPORTS[name]) return true
      console.warn(`[screenshots] Viewport inconnu ignoré : "${name}"`)
      return false
    })

  const outDir = path.resolve(
    REPO_ROOT,
    args.out || path.join('documentation', 'screenshots', siteId),
  )
  fs.mkdirSync(outDir, { recursive: true })

  let server = null
  if (args['keep-server'] !== 'true') {
    console.log(`[screenshots] Démarrage de Vite pour "${siteId}" sur ${baseUrl}…`)
    server = startDevServer(siteId, port)
  }

  const browser = await chromium.launch()
  const written = []

  try {
    await waitForServer(baseUrl)

    for (const name of viewportNames) {
      const context = await browser.newContext({
        viewport: { width: VIEWPORTS[name].width, height: VIEWPORTS[name].height },
        deviceScaleFactor: VIEWPORTS[name].deviceScaleFactor,
        isMobile: VIEWPORTS[name].isMobile ?? false,
        hasTouch: VIEWPORTS[name].hasTouch ?? false,
        // Sans langue explicite, le navigateur headless annonce `en-US` et un
        // site multilingue se rend en anglais.
        locale,
        // Coupe les animations d'entrée : sans ça, deux exécutions ne donnent
        // jamais la même image et chaque capture pollue le diff Git.
        reducedMotion: 'reduce',
      })

      // Franchit la page de maintenance : le garde du router lit ce drapeau
      // (`maintenanceService.isAuthenticated`). Sans lui, toutes les routes
      // rendent l'écran « site en construction ».
      await context.addInitScript((id) => {
        try {
          window.localStorage.setItem(`maintenance_authenticated_${id}`, 'true')
        } catch {
          // storage indisponible : la capture montrera l'écran de maintenance
        }
      }, siteId)

      // Le bouton flottant des Vue DevTools n'existe qu'en dev : il n'a rien à
      // faire sur une capture de référence.
      await context.addInitScript(() => {
        const style = document.createElement('style')
        style.textContent =
          '#vue-devtools-anchor,[data-v-inspector-container]{display:none!important}'
        document.documentElement.appendChild(style)
      })

      const page = await context.newPage()

      for (const route of routes) {
        const url = `${baseUrl}${route}`
        try {
          const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 })
          if (response && response.status() >= 400) {
            console.warn(`[screenshots] ${route} → HTTP ${response.status()}, ignorée.`)
            continue
          }
          // Le bandeau cookies masque le bas de page tant qu'aucun choix n'est
          // fait. Le clic est mémorisé dans le contexte : une seule fois suffit.
          await dismissCookieBanner(page)

          // Laisse retomber les transitions et le chargement paresseux des images.
          await page.waitForTimeout(1200)
          // Un aller-retour de scroll déclenche les images en `loading="lazy"`
          // et les animations d'apparition liées au défilement.
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
          await page.waitForTimeout(900)
          await page.evaluate(() => window.scrollTo(0, 0))
          // Assez long pour que les révélations au scroll se soient terminées :
          // capturer plus tôt fige des blocs à mi-animation.
          await page.waitForTimeout(1500)
          await freezeStickyElements(page)

          const file = path.join(outDir, `${routeToSlug(route)}-${name}.jpg`)
          await page.screenshot({ path: file, fullPage: true, type: 'jpeg', quality })
          written.push(path.relative(REPO_ROOT, file))
          console.log(`[screenshots] ✓ ${route} (${name})`)
        } catch (err) {
          console.warn(`[screenshots] ✗ ${route} (${name}) : ${err.message}`)
        }
      }

      await context.close()
    }
  } finally {
    await browser.close()
    if (server) server.kill()
  }

  if (written.length === 0) {
    console.error('[screenshots] Aucune capture produite.')
    process.exitCode = 1
    return
  }

  const index = [
    `# Captures — ${siteId}`,
    '',
    `Générées le ${new Date().toISOString().slice(0, 10)} par \`npm run screenshots\`.`,
    '',
    ...written.map((f) => `- \`${path.basename(f)}\``),
    '',
  ].join('\n')
  fs.writeFileSync(path.join(outDir, 'INDEX.md'), index, 'utf8')

  console.log(`[screenshots] ${written.length} capture(s) dans ${path.relative(REPO_ROOT, outDir)}`)
}

main().catch((err) => {
  console.error('[screenshots]', err)
  process.exitCode = 1
})
