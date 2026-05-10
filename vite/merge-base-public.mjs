import fs from 'node:fs'
import path from 'node:path'

/**
 * Sert et copie les assets statiques partagés du package `packages/base/public`
 * (ex. logos marques sous `/brands/vendor/*`) : en dev le dossier site `public/`
 * ne les contient pas, donc middleware ; en build on fusionne dans `outDir`.
 *
 * @param {{ repoRoot: string }} options
 * @returns {import('vite').Plugin}
 */
export function mergeBasePublicPlugin({ repoRoot }) {
  const basePublicRoot = path.join(repoRoot, 'packages/base/public')
  const vendorPublicRoot = path.join(basePublicRoot, 'brands', 'vendor')
  const vendorResolved = path.resolve(vendorPublicRoot)

  let outDirAbs = path.join(repoRoot, 'dist')

  /** @param {string} urlPath path sous basePublicRoot (ex. brands/vendor/omega.svg) */
  function resolveVendorFile(urlPath) {
    const normalized = path.normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, '')
    const abs = path.resolve(basePublicRoot, normalized)
    if (!abs.startsWith(vendorResolved + path.sep) && abs !== vendorResolved) return null
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) return null
    return abs
  }

  return {
    name: 'merge-base-public',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const raw = req.url?.split('?')[0] ?? ''
        if (!raw.startsWith('/brands/vendor/')) return next()
        const decoded = decodeURIComponent(raw.slice(1))
        const filePath = resolveVendorFile(decoded)
        if (!filePath) return next()
        const ext = path.extname(filePath).toLowerCase()
        const types = {
          '.svg': 'image/svg+xml; charset=utf-8',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.webp': 'image/webp',
          '.gif': 'image/gif',
        }
        res.setHeader('Content-Type', types[ext] || 'application/octet-stream')
        fs.createReadStream(filePath).on('error', next).pipe(res)
      })
    },
    configResolved(config) {
      outDirAbs = path.resolve(config.build.outDir)
    },
    closeBundle() {
      if (!fs.existsSync(vendorPublicRoot)) return
      const destRoot = path.join(outDirAbs, 'brands', 'vendor')
      fs.mkdirSync(destRoot, { recursive: true })
      fs.cpSync(vendorPublicRoot, destRoot, { recursive: true })
    },
  }
}
