/**
 * Liens vers les pages légales activées par `features.legal` (router + footer + checkout).
 *
 * Les libellés sont des clés de catalogue et non du texte : ces liens sont rendus dans les trois
 * langues (voir `packages/base/src/i18n/messages/`). Les chemins, eux, restent en français —
 * traduire les URLs casserait les liens existants et les redirections SEO.
 */
export const LEGAL_NAV_LINKS = [
  { path: '/mentions-legales', labelKey: 'legal.mentions' },
  { path: '/politique-confidentialite', labelKey: 'legal.privacy' },
  { path: '/conditions-generales-utilisation', labelKey: 'legal.terms' },
]
