/**
 * Typographie par défaut du socle — alignée sur Sauvage Watches (Poppins + HK Grotesk).
 * Surchargeable par site via `theme.typography` dans `sites/<SITE_ID>/site.config.js`.
 */
export const DEFAULT_TYPOGRAPHY = {
  /** Préfixe des fichiers servis depuis `sites/<SITE_ID>/public/fonts/`. */
  fontsPath: '/fonts/',
  sans: {
    family: 'HK Grotesk',
    fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
    faces: [
      { weight: 400, style: 'normal', file: 'HK Grotesk Regular.woff2' },
      { weight: 400, style: 'italic', file: 'HK Grotesk Italic.woff2' },
      { weight: 800, style: 'normal', file: 'HK Grotesk ExtraBold.woff2' },
    ],
  },
  heading: {
    family: 'Poppins',
    fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
    faces: [{ weight: 700, style: 'normal', file: 'Poppins Bold.woff2' }],
  },
  /** h3 / h4 — même pile que `sans` par défaut, graisse extra-bold. */
  subheading: {
    role: 'sans',
    weight: 800,
  },
  headingWeight: 700,
}
