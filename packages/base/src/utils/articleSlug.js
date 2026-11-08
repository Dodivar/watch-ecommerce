/**
 * Adresse d'un article de blog : `/blog/<slug>`, ou `/blog/<uuid>` tant que l'article n'a pas de
 * slug — projet Supabase sans la colonne `articles.slug` (migration
 * `20261108120000_slugs_dedup_history_articles.sql` non appliquée), ou ligne pas encore reprise.
 *
 * Pas d'alias `@/` : module lu aussi par Node (`api/render-page.js`, sitemap).
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** L'ancienne forme d'adresse `/blog/<uuid>`. */
export function isArticleUuid(value) {
  return typeof value === 'string' && UUID_RE.test(value)
}

/** @param {{ id?: string, slug?: string | null } | null | undefined} article */
export function buildArticleKey(article) {
  return String(article?.slug || article?.id || '')
}

/** @param {{ id?: string, slug?: string | null } | null | undefined} article */
export function buildArticlePath(article) {
  const key = buildArticleKey(article)
  return key ? `/blog/${key}` : '/blog'
}
