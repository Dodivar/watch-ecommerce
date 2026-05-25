import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import { mergeBasePublicPlugin } from './merge-base-public.mjs'
import { siteFromConfigPlugin } from './site-from-config.mjs'
import { REPO_ROOT, resolveSitePaths } from './resolve-site.mjs'

const baseSrc = path.join(REPO_ROOT, 'packages/base/src')

function createNodeLocalStorage() {
  const values = new Map()

  return {
    get length() {
      return values.size
    },
    clear() {
      values.clear()
    },
    getItem(key) {
      return values.get(String(key)) ?? null
    },
    key(index) {
      return Array.from(values.keys())[index] ?? null
    },
    removeItem(key) {
      values.delete(String(key))
    },
    setItem(key, value) {
      values.set(String(key), String(value))
    },
  }
}

function ensureNodeLocalStorage() {
  if (typeof globalThis.localStorage?.getItem === 'function') return

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: createNodeLocalStorage(),
  })
}

// https://vite.dev/config/
export default defineConfig(async ({ command }) => {
  const requireExplicitSiteId = command === 'build'
  const { siteId, siteRoot, siteConfigPath, siteSrcPath } = resolveSitePaths({
    requireExplicit: requireExplicitSiteId,
  })

  if (!fs.existsSync(siteSrcPath)) {
    throw new Error(
      `SITE_ID "${siteId}" must define sites/${siteId}/src/ (Vite alias @site/* points there).`,
    )
  }

  const siteConfigHref = pathToFileURL(siteConfigPath).href
  const { default: siteConfig } = await import(siteConfigHref)

  const plugins = [
    mergeBasePublicPlugin({ repoRoot: REPO_ROOT }),
    siteFromConfigPlugin(siteConfig),
    vue(),
  ]

  if (command === 'serve') {
    ensureNodeLocalStorage()
    const { default: vueDevTools } = await import('vite-plugin-vue-devtools')
    plugins.push(vueDevTools())
  }

  return {
    root: siteRoot,
    envDir: REPO_ROOT,
    publicDir: 'public',
    base: process.env.VITE_BASE_PATH || '/',
    define: {
      'import.meta.env.VITE_SITE_ID': JSON.stringify(siteId),
    },
    plugins,
    resolve: {
      alias: {
        '@': baseSrc,
        '@site-config': siteConfigPath,
        '@site': siteSrcPath,
      },
    },
    build: {
      outDir: path.join(REPO_ROOT, 'dist'),
      emptyOutDir: true,
    },
    server: {
      fs: {
        allow: [REPO_ROOT],
      },
    },
  }
})
