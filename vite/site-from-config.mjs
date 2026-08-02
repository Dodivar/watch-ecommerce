import { resolveTypography } from '../packages/base/src/site/resolveTypography.js'
import { resolveVisual, getRadiusPreset } from '../packages/base/src/site/resolveVisual.js'

function escapeHtmlAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
}

function buildFontFaceCss(typography) {
  const seen = new Set()
  const rules = []

  for (const role of [typography.sans, typography.heading]) {
    for (const face of role.faces) {
      const key = `${role.family}|${face.weight}|${face.style}|${face.src}`
      if (seen.has(key)) continue
      seen.add(key)

      rules.push(`@font-face {
  font-family: '${role.family}';
  font-style: ${face.style};
  font-weight: ${face.weight};
  font-display: swap;
  src: url('${face.src}') format('woff2');
}`)
    }
  }

  return rules.join('\n\n')
}

function buildThemeCss(siteConfig) {
  const t = siteConfig.theme.colors
  const typography = resolveTypography(siteConfig)
  const { radius } = resolveVisual(siteConfig)

  return `${buildFontFaceCss(typography)}

:root {
  --color-primary: ${t.primary};
  --color-primary-hover: ${t.primaryHover};
  --color-cream: ${t.cream};
  --color-cream-100: ${t.cream100};
  --color-cream-200: ${t.cream200};
  --color-cream-300: ${t.cream300};
  --color-text-main: ${t.textMain};
  --color-text-on-dark: ${t.textOnDark ?? '#ffffff'};
  --font-sans: ${typography.sans.stack};
  --font-heading: ${typography.heading.stack};
  --font-subheading: ${typography.subheading.stack};
  --font-heading-weight: ${typography.headingWeight};
  --font-subheading-weight: ${typography.subheading.weight};
  --radius-sm: ${radius.sm};
  --radius-default: ${radius.DEFAULT};
  --radius-md: ${radius.md};
  --radius-lg: ${radius.lg};
  --radius-xl: ${radius.xl};
  --radius-2xl: ${radius['2xl']};
  --radius-3xl: ${radius['3xl']};
  --radius-full: ${radius.full};
}
`
}

/**
 * Injects index.html meta from the active `sites/<SITE_ID>/site.config.js` and serves virtual theme CSS variables.
 * @param {Record<string, unknown>} siteConfig
 */
export function siteFromConfigPlugin(siteConfig) {
  const virtualId = '\0virtual:site-theme.css'

  return {
    name: 'site-from-config',
    resolveId(id) {
      if (id === 'virtual:site-theme.css') return virtualId
    },
    load(id) {
      if (id === virtualId) {
        return buildThemeCss(siteConfig)
      }
    },
    transformIndexHtml(html) {
      const ix = siteConfig.seo.indexHtml
      const base = siteConfig.urls.production.replace(/\/$/, '')
      const ogImagePath = ix.ogImagePath.startsWith('/') ? ix.ogImagePath : `/${ix.ogImagePath}`
      const ogImageAbsolute = `${base}${ogImagePath}`

      /** Match legacy index.html: canonical / og:url without trailing slash on bare domain */
      const canonical = base

      const themeColor = siteConfig.theme?.colors?.browserChrome ?? '#ffffff'

      const map = {
        __SITE_LANG__: siteConfig.locale,
        __THEME_COLOR__: escapeHtmlAttr(themeColor),
        __APPLE_MOBILE_TITLE__: escapeHtmlAttr(ix.appleMobileWebAppTitle),
        __INDEX_HTML_TITLE__: escapeHtmlAttr(ix.title),
        __META_DESCRIPTION__: escapeHtmlAttr(ix.metaDescription),
        __META_KEYWORDS__: escapeHtmlAttr(ix.keywords),
        __META_AUTHOR__: escapeHtmlAttr(ix.author),
        __CANONICAL_URL__: escapeHtmlAttr(canonical),
        __OG_URL__: escapeHtmlAttr(canonical),
        __OG_TITLE__: escapeHtmlAttr(ix.ogTitle),
        __OG_DESCRIPTION__: escapeHtmlAttr(ix.ogDescription),
        __OG_IMAGE__: escapeHtmlAttr(ogImageAbsolute),
        __OG_LOCALE__: escapeHtmlAttr(ix.ogLocale),
        __OG_SITE_NAME__: escapeHtmlAttr(ix.ogSiteName),
        __TWITTER_CARD__: escapeHtmlAttr(ix.twitterCard),
        __TWITTER_URL__: escapeHtmlAttr(canonical),
        __TWITTER_TITLE__: escapeHtmlAttr(ix.twitterTitle ?? ix.ogTitle),
        __TWITTER_DESCRIPTION__: escapeHtmlAttr(ix.twitterDescription ?? ix.ogDescription),
        __TWITTER_IMAGE__: escapeHtmlAttr(ogImageAbsolute),
      }

      let out = html
      for (const [token, value] of Object.entries(map)) {
        out = out.split(token).join(value)
      }

      const radiusPreset = getRadiusPreset(siteConfig)
      if (radiusPreset !== 'rounded') {
        out = out.replace('<html', `<html data-ui-radius="${escapeHtmlAttr(radiusPreset)}"`)
      }
      if (siteConfig.theme?.colorScheme === 'dark') {
        out = out.replace('<html', '<html data-ui-color-scheme="dark"')
      }

      return out
    },
  }
}
