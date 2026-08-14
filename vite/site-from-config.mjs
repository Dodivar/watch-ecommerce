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

/* --- Dérivation de palette : la teinte de marque (`primary`) engendre les nuances --- */

function hexToRgb(hex) {
  const clean = String(hex).replace('#', '').trim()
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean
  const int = Number.parseInt(full, 16)
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 }
}

function rgbToHex({ r, g, b }) {
  const channel = (v) =>
    Math.round(Math.max(0, Math.min(255, v)))
      .toString(16)
      .padStart(2, '0')
  return `#${channel(r)}${channel(g)}${channel(b)}`
}

function rgbToHsl({ r, g, b }) {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  const delta = max - min

  if (delta === 0) return { h: 0, s: 0, l }

  const s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min)
  let h
  if (max === rn) h = ((gn - bn) / delta) % 6
  else if (max === gn) h = (bn - rn) / delta + 2
  else h = (rn - gn) / delta + 4

  return { h: (h * 60 + 360) % 360, s, l }
}

function hslToRgb({ h, s, l }) {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x]

  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 }
}

const clamp01 = (v) => Math.max(0, Math.min(1, v))

/** Variante de `hex` : `lightness`/`saturation` absolus, `lighten` relatif. */
function shade(hex, { lightness, lighten = 0, saturation, maxSaturation } = {}) {
  const hsl = rgbToHsl(hexToRgb(hex))
  let s = saturation ?? hsl.s
  if (maxSaturation !== undefined) s = Math.min(s, maxSaturation)
  const l = clamp01(lightness ?? hsl.l + lighten)
  return rgbToHex(hslToRgb({ h: hsl.h, s: clamp01(s), l }))
}

/**
 * Palette complète dérivée des couleurs du site : nuances de marque, textes
 * secondaires, bordures, dégradés et ombres teintées. Les rôles sont identiques
 * pour tous les sites — seule la teinte `primary` change.
 */
function buildPaletteCss(colors) {
  const primary = colors.primary
  /**
   * Canaux séparés par des espaces : indispensables pour que Tailwind résolve
   * les modificateurs d'opacité (`bg-primary/10`, `border-primary/30`…) via
   * `rgb(var(--…-rgb) / <alpha-value>)`. Avec une simple valeur hexadécimale,
   * ces utilitaires ne génèrent aucune règle et le style est silencieusement
   * perdu. Les variables hexadécimales restent disponibles pour le CSS écrit
   * à la main.
   */
  const channels = (hex) => {
    const { r, g, b } = hexToRgb(hex)
    return `${r} ${g} ${b}`
  }
  const rgb = channels(primary)
  /** Teinte marque translucide, utilisable en CSS manuel. */
  const alpha = (a) => `rgb(${rgb} / ${a})`

  /** Éclaircie de la marque : sommet des dégradés, icônes et états survolés. */
  const soft = shade(primary, { lighten: 0.13 })
  /** Assombrie : pied des dégradés, profondeur des grandes surfaces. */
  const deep = shade(primary, { lighten: -0.055 })
  /** Lavis quasi blanc : surfaces survolées et fonds de puces sur fond clair. */
  const tint = shade(primary, { lightness: 0.955, maxSaturation: 0.34 })
  /** Teinte claire désaturée : textes secondaires et filets sur fond de marque. */
  const sage = shade(primary, { lightness: 0.78, maxSaturation: 0.26 })

  return `  --color-primary-soft: ${soft};
  --color-primary-deep: ${deep};
  --color-primary-tint: ${tint};
  --color-primary-sage: ${sage};

  /* Canaux RVB — support des modificateurs d'opacité Tailwind. */
  --color-primary-rgb: ${rgb};
  --color-primary-hover-rgb: ${channels(colors.primaryHover)};
  --color-primary-soft-rgb: ${channels(soft)};
  --color-primary-deep-rgb: ${channels(deep)};
  --color-primary-tint-rgb: ${channels(tint)};
  --color-primary-sage-rgb: ${channels(sage)};
  --color-cream-rgb: ${channels(colors.cream)};
  --color-cream-100-rgb: ${channels(colors.cream100)};
  --color-cream-200-rgb: ${channels(colors.cream200)};
  --color-cream-300-rgb: ${channels(colors.cream300)};
  --color-text-main-rgb: ${channels(colors.textMain)};
  --color-text-on-dark-rgb: ${channels(colors.textOnDark ?? '#ffffff')};

  /*
   * Textes secondaires — un gris teinté marque plutôt qu'un gris neutre.
   * Opacités calées pour rester ≥ 4.5:1 sur le beige, le fond clair le plus
   * exigeant du site (le blanc est plus permissif).
   */
  --color-text-muted: ${alpha(0.8)};
  --color-text-muted-on-dark: rgb(255 255 255 / 0.76);
  /* Troisième niveau : métadonnées, légendes, compteurs. */
  --color-text-subtle: ${alpha(0.68)};
  --color-text-subtle-on-dark: rgb(255 255 255 / 0.66);

  /* Bordures : filets discrets sur clair, filets lumineux sur fond de marque. */
  --color-border-subtle: ${alpha(0.1)};
  --color-border-strong: ${alpha(0.22)};
  --color-border-on-dark: rgb(255 255 255 / 0.16);

  /* Dégradés — voir « Système de surfaces » dans assets/main.css. */
  --gradient-forest: linear-gradient(158deg, ${soft} 0%, ${primary} 46%, ${deep} 100%);
  --gradient-forest-soft: linear-gradient(180deg, ${primary} 0%, ${deep} 100%);
  --gradient-canvas: linear-gradient(180deg, #ffffff 0%, ${colors.cream} 100%);
  /* Renflement beige symétrique : se raccorde au beige de part et d'autre. */
  --gradient-sand: linear-gradient(180deg, ${colors.cream} 0%, ${colors.cream100} 52%, ${colors.cream} 100%);
  --gradient-sand-to-white: linear-gradient(180deg, ${colors.cream} 0%, #ffffff 100%);
  --gradient-white-to-sand: linear-gradient(180deg, #ffffff 0%, ${colors.cream} 100%);
  --gradient-cta: linear-gradient(135deg, ${soft} 0%, ${primary} 62%, ${deep} 100%);
  --gradient-cta-hover: linear-gradient(135deg, ${shade(primary, { lighten: 0.2 })} 0%, ${soft} 62%, ${primary} 100%);
  --gradient-card: linear-gradient(168deg, #ffffff 0%, ${colors.cream} 165%);
  --gradient-hairline: linear-gradient(90deg, transparent 0%, ${alpha(0.28)} 50%, transparent 100%);
  --gradient-hairline-on-dark: linear-gradient(90deg, transparent 0%, rgb(255 255 255 / 0.28) 50%, transparent 100%);

  /*
   * Ombres teintées marque plutôt que noir neutre : la profondeur reste dans la
   * même famille chromatique que les fonds. Cette échelle remplace celle de
   * Tailwind (shadow-sm → shadow-2xl) dans tailwind.config.js.
   */
  --shadow-xs: 0 1px 2px ${alpha(0.07)};
  --shadow-soft: 0 1px 2px ${alpha(0.05)}, 0 8px 24px -14px ${alpha(0.22)};
  --shadow-card: 0 2px 4px ${alpha(0.04)}, 0 18px 40px -24px ${alpha(0.3)};
  --shadow-lift: 0 6px 14px ${alpha(0.07)}, 0 30px 60px -26px ${alpha(0.38)};
  --shadow-modal: 0 8px 20px ${alpha(0.12)}, 0 40px 80px -20px ${alpha(0.5)};
  --shadow-forest: 0 26px 64px -30px ${alpha(0.6)};`
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
${buildPaletteCss(t)}
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
      /**
       * `theme.surface: 'gradient'` active la couche de dégradés du socle
       * (boutons, badges, filets) — voir « Surfaces dégradées » dans main.css.
       * Les sites qui ne l'activent pas gardent des aplats.
       */
      if (siteConfig.theme?.surface === 'gradient') {
        out = out.replace('<html', '<html data-ui-surface="gradient"')
      }

      return out
    },
  }
}
