/**
 * Découpe un texte de document juridique (voir `sites/<id>/legal.config.js`) en segments
 * affichables : texte, gras, lien. Rendu par `LegalDocument.vue` sans `v-html` : le contenu vient
 * du manifest, mais rien n'est interprété comme du HTML.
 *
 * Syntaxe : `**gras**`, `[libellé](https://…)`, et toute adresse e-mail devient un lien `mailto:`.
 *
 * @param {string} text
 * @returns {Array<{ type: 'text' | 'bold' | 'link', text: string, href?: string }>}
 */
export function parseLegalInline(text) {
  const segments = []
  const token = /\*\*(.+?)\*\*|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g
  let last = 0
  for (const match of String(text).matchAll(token)) {
    if (match.index > last) segments.push({ type: 'text', text: text.slice(last, match.index) })
    if (match[1] != null) {
      // Un e-mail en gras reste cliquable.
      const inner = parseLegalInline(match[1])
      if (inner.length === 1 && inner[0].type === 'text') {
        segments.push({ type: 'bold', text: match[1] })
      } else {
        segments.push(...inner)
      }
    } else if (match[2] != null) {
      segments.push({ type: 'link', text: match[2], href: match[3] })
    } else {
      segments.push({ type: 'link', text: match[4], href: `mailto:${match[4]}` })
    }
    last = match.index + match[0].length
  }
  if (last < text.length) segments.push({ type: 'text', text: text.slice(last) })
  return segments
}
