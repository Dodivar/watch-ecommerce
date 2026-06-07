/**
 * Vercel build entry: each client project sets SITE_ID in env; this validates
 * before delegating to `npm run build` (Vite + sites/<SITE_ID>/).
 */
import { spawnSync } from 'node:child_process'

import { resolveSitePaths } from '../vite/resolve-site.mjs'

try {
  const { siteId } = resolveSitePaths({ requireExplicit: true })
  console.log(`[vercel-build] SITE_ID=${siteId}`)
} catch (err) {
  console.error('[vercel-build]', err instanceof Error ? err.message : err)
  process.exit(1)
}

const build = spawnSync('npm', ['run', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
})

if (build.status !== 0) {
  process.exit(build.status === null ? 1 : build.status)
}

const seoRedirects = spawnSync('node', ['scripts/generate-vercel-seo-redirects.mjs'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
})

if (seoRedirects.status !== 0) {
  process.exit(seoRedirects.status === null ? 1 : seoRedirects.status)
}

const prerender = spawnSync('node', ['scripts/prerender-static-routes.mjs'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
})

process.exit(prerender.status === null ? 1 : prerender.status)
