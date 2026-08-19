/**
 * Vocabulaire des caractéristiques de montre venant de Supabase.
 *
 * Les colonnes de `watches` / `watch_details` sont du texte libre saisi en français par
 * l'administrateur, mais le vocabulaire réellement employé est minuscule (« Acier »,
 * « Full set », « Excellent état », « 1 an de garantie »…). Ce fichier associe chaque
 * formulation rencontrée à une clé de catalogue, ce qui permet de traduire la valeur à
 * l'affichage sans rien écrire en base.
 *
 * Deux propriétés importantes :
 *
 * - **Repli sur la valeur brute.** La même colonne peut contenir une valeur à ne pas traduire :
 *   `movement` vaut tantôt « Remontage automatique », tantôt un calibre (`3235`, `MT5400`).
 *   Une valeur absente d'ici s'affiche telle quelle, dans toutes les langues.
 * - **Familles sémantiques, pas colonnes.** `condition` sert à `watches.condition` comme aux
 *   trois `*_condition` ; `material` sert au boîtier comme au bracelet.
 *
 * Pour ajouter une formulation : compléter `aliases` (en minuscules, sans accents — voir
 * `normalizeSpecText`). Pour ajouter une notion : nouvelle entrée ici + la clé dans les trois
 * catalogues de `i18n/messages/`, dont `messages.test.js` vérifie la parité.
 *
 * @type {Record<string, Array<{ key: string, aliases: string[] }>>}
 */
export const WATCH_SPEC_VOCABULARY = {
  // — Type de mouvement (le champ contient aussi des calibres : repli brut)
  movement: [
    {
      key: 'watchSpec.movement.automatic',
      aliases: ['remontage automatique', 'automatique', 'automatic', 'auto', 'automatik'],
    },
    {
      key: 'watchSpec.movement.manual',
      aliases: [
        'remontage manuel',
        'manuel',
        'manuelle',
        'manual',
        'mecanique manuel',
        'handaufzug',
      ],
    },
    { key: 'watchSpec.movement.quartz', aliases: ['quartz', 'a quartz', 'quarz'] },
    { key: 'watchSpec.movement.solar', aliases: ['solaire', 'solar'] },
    { key: 'watchSpec.movement.kinetic', aliases: ['cinetique', 'kinetic', 'autoquartz'] },
    { key: 'watchSpec.movement.smart', aliases: ['connectee', 'connecte', 'smart', 'smartwatch'] },
    { key: 'watchSpec.movement.hybrid', aliases: ['hybride', 'hybrid'] },
  ],

  // — Matières (boîtier et bracelet)
  material: [
    {
      key: 'watchSpec.material.steel',
      aliases: ['acier', 'acier inoxydable', 'inox', 'acier inox'],
    },
    { key: 'watchSpec.material.gold', aliases: ['or'] },
    { key: 'watchSpec.material.yellowGold', aliases: ['or jaune'] },
    { key: 'watchSpec.material.roseGold', aliases: ['or rose', 'or rouge'] },
    { key: 'watchSpec.material.whiteGold', aliases: ['or blanc'] },
    { key: 'watchSpec.material.platinum', aliases: ['platine'] },
    { key: 'watchSpec.material.titanium', aliases: ['titane', 'titanium'] },
    { key: 'watchSpec.material.ceramic', aliases: ['ceramique', 'ceramic'] },
    { key: 'watchSpec.material.bronze', aliases: ['bronze'] },
    { key: 'watchSpec.material.leather', aliases: ['cuir', 'cuir veritable'] },
    {
      key: 'watchSpec.material.crocodileLeather',
      aliases: ['cuir de crocodile', 'cuir crocodile', 'crocodile'],
    },
    {
      key: 'watchSpec.material.rubber',
      aliases: ['caoutchouc', 'silicone', 'caoutchouc silicone'],
    },
    { key: 'watchSpec.material.fabric', aliases: ['tissu', 'nato', 'tissu / nato', 'toile'] },
  ],

  // — Couleurs (cadran et bracelet)
  color: [
    { key: 'watchSpec.color.black', aliases: ['noir', 'noire'] },
    { key: 'watchSpec.color.white', aliases: ['blanc', 'blanche'] },
    { key: 'watchSpec.color.silver', aliases: ['argent', 'argente'] },
    { key: 'watchSpec.color.grey', aliases: ['gris', 'grise', 'anthracite'] },
    { key: 'watchSpec.color.blue', aliases: ['bleu', 'bleue'] },
    { key: 'watchSpec.color.green', aliases: ['vert', 'verte'] },
    { key: 'watchSpec.color.brown', aliases: ['marron', 'brun'] },
    { key: 'watchSpec.color.champagne', aliases: ['champagne'] },
    { key: 'watchSpec.color.salmon', aliases: ['saumon'] },
    { key: 'watchSpec.color.bronze', aliases: ['bronze'] },
    { key: 'watchSpec.color.gold', aliases: ['dore', 'or'] },
    { key: 'watchSpec.color.roseGold', aliases: ['or rose'] },
  ],

  // — Matière de la glace
  crystal: [
    { key: 'watchSpec.crystal.sapphire', aliases: ['saphir', 'sapphire', 'verre saphir'] },
    { key: 'watchSpec.crystal.mineral', aliases: ['mineral', 'verre mineral'] },
    {
      key: 'watchSpec.crystal.acrylic',
      aliases: ['plexiglas', 'plexiglass', 'acrylique', 'acrylic'],
    },
    { key: 'watchSpec.crystal.hesalite', aliases: ['hesalite'] },
  ],

  // — État général (watches.condition + case/dial/bracelet_condition)
  condition: [
    { key: 'watchSpec.condition.new', aliases: ['neuf', 'neuve', 'jamais portee', 'new'] },
    { key: 'watchSpec.condition.likeNew', aliases: ['comme neuf', 'comme neuve', 'like new'] },
    { key: 'watchSpec.condition.perfect', aliases: ['parfait', 'parfait etat', 'parfaite'] },
    {
      key: 'watchSpec.condition.excellent',
      aliases: ['excellent', 'excellent etat', 'excellente'],
    },
    { key: 'watchSpec.condition.veryGood', aliases: ['tres bon', 'tres bon etat', 'very good'] },
    { key: 'watchSpec.condition.good', aliases: ['bon', 'bon etat', 'good'] },
    {
      key: 'watchSpec.condition.fair',
      aliases: ['correct', 'etat correct', 'moyen', 'etat d usage', 'fair'],
    },
  ],

  // — Contenu de la livraison (watch_details.content)
  content: [
    { key: 'watchSpec.content.fullSet', aliases: ['full set', 'fullset'] },
    { key: 'watchSpec.content.watchOnly', aliases: ['montre seule', 'montre nue'] },
    {
      key: 'watchSpec.content.withBox',
      aliases: ['avec boite d origine', 'boite d origine', 'avec boite'],
    },
    {
      key: 'watchSpec.content.withBoxAndPapers',
      aliases: [
        'boite et papier d origine',
        'boite et papiers d origine',
        'avec boite et papiers d origine',
      ],
    },
    {
      key: 'watchSpec.content.withCards',
      aliases: ['avec cartes d origine', 'avec carte d origine', 'cartes d origine'],
    },
  ],

  // — Jetons de `watch_details.functions` (liste séparée par des virgules)
  fn: [
    { key: 'watchSpec.fn.hours', aliases: ['heures', 'heure'] },
    { key: 'watchSpec.fn.minutes', aliases: ['minutes', 'minute'] },
    { key: 'watchSpec.fn.seconds', aliases: ['secondes', 'seconde'] },
    { key: 'watchSpec.fn.smallSeconds', aliases: ['petite seconde', 'petites secondes'] },
    { key: 'watchSpec.fn.centralSeconds', aliases: ['seconde centrale', 'secondes centrales'] },
    { key: 'watchSpec.fn.date', aliases: ['date', 'dateur'] },
    { key: 'watchSpec.fn.day', aliases: ['jour', 'jour de la semaine'] },
    { key: 'watchSpec.fn.dayDate', aliases: ['jour date', 'jour et date'] },
    { key: 'watchSpec.fn.chronograph', aliases: ['chronographe', 'chrono'] },
    { key: 'watchSpec.fn.chronometer', aliases: ['chronometre', 'certifie chronometre'] },
    { key: 'watchSpec.fn.gmt', aliases: ['gmt', 'double fuseau', 'second fuseau'] },
    { key: 'watchSpec.fn.worldTime', aliases: ['heure universelle', 'worldtimer'] },
    { key: 'watchSpec.fn.moonPhase', aliases: ['phase de lune', 'phases de lune'] },
    {
      key: 'watchSpec.fn.powerReserveIndicator',
      aliases: ['reserve de marche', 'indicateur de reserve de marche', 'indicateur de reserve'],
    },
    { key: 'watchSpec.fn.tachymeter', aliases: ['tachymetre', 'tachymeter'] },
    { key: 'watchSpec.fn.alarm', aliases: ['alarme', 'reveil'] },
    { key: 'watchSpec.fn.annualCalendar', aliases: ['calendrier annuel'] },
    {
      key: 'watchSpec.fn.perpetualCalendar',
      aliases: ['calendrier perpetuel', 'quantieme perpetuel'],
    },
    { key: 'watchSpec.fn.tourbillon', aliases: ['tourbillon'] },
    { key: 'watchSpec.fn.skeleton', aliases: ['squelette', 'skeleton'] },
    {
      key: 'watchSpec.fn.display24h',
      aliases: ['affichage 24h', '24 heures', 'affichage 24 heures'],
    },
  ],

  // — Accessoires (`watch_accessories.name`)
  accessory: [
    { key: 'watchSpec.accessory.box', aliases: ['boite d origine', 'boite', 'boite originale'] },
    { key: 'watchSpec.accessory.outerBox', aliases: ['sur boite d origine', 'sur boite'] },
    {
      key: 'watchSpec.accessory.papers',
      aliases: ['papiers d origine', 'papiers d origines', 'papier d origine', 'papiers'],
    },
    {
      key: 'watchSpec.accessory.warrantyCard',
      aliases: [
        'carte de garantie d origine',
        'carte de garantie',
        'attestation de garantie d origine',
        'attestation de garantie',
      ],
    },
    { key: 'watchSpec.accessory.originalCard', aliases: ['carte d origine', 'cartes d origine'] },
    {
      key: 'watchSpec.accessory.authenticityCertificate',
      aliases: ['certificat d authenticite', 'certificat d authenticite d origine'],
    },
    { key: 'watchSpec.accessory.invoice', aliases: ['facture d origine', 'facture'] },
    { key: 'watchSpec.accessory.userManual', aliases: ['manuel d utilisation', 'manuel', 'notice'] },
    { key: 'watchSpec.accessory.tags', aliases: ['etiquettes', 'etiquette'] },
    { key: 'watchSpec.accessory.travelCase', aliases: ['ecrin de voyage', 'etui de voyage'] },
    { key: 'watchSpec.accessory.extraStrap', aliases: ['bracelet supplementaire', 'second bracelet'] },
  ],

  // — Cible du catalogue (`watches.audience`, slugs de `watch_audiences`)
  audience: [
    { key: 'watchSpec.audience.unisexe', aliases: ['unisexe', 'unisex', 'mixte'] },
    { key: 'watchSpec.audience.homme', aliases: ['homme', 'hommes'] },
    { key: 'watchSpec.audience.femme', aliases: ['femme', 'femmes'] },
    { key: 'watchSpec.audience.enfant', aliases: ['enfant', 'enfants'] },
  ],
}

/**
 * Forme comparable d'une valeur saisie : minuscules, sans accents ni apostrophes typographiques,
 * espaces compactés. C'est ce qui fait tomber « Excellent », « Excellent état » et
 * « excellent  etat » sur la même entrée, et « Boite » sur « Boîte ».
 *
 * L'apostrophe et le trait d'union deviennent des espaces, pour que « boite d'origine » /
 * « boite d origine » et « sur-boîte » / « sur boîte » ne fassent chacun qu'un seul alias.
 *
 * @param {unknown} raw
 * @returns {string}
 */
export function normalizeSpecText(raw) {
  if (raw === null || raw === undefined) return ''
  return String(raw)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/['’`\-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** @type {Map<string, Map<string, string>>} */
const INDEX_BY_FAMILY = new Map(
  Object.entries(WATCH_SPEC_VOCABULARY).map(([family, entries]) => [
    family,
    new Map(entries.flatMap(({ key, aliases }) => aliases.map((alias) => [alias, key]))),
  ]),
)

/**
 * Clé de catalogue correspondant à une valeur saisie, ou `null` si le vocabulaire ne la
 * connaît pas (calibre, nom commercial, formulation inédite).
 *
 * @param {string} family  Une clé de `WATCH_SPEC_VOCABULARY`.
 * @param {unknown} raw
 * @returns {string | null}
 */
export function resolveSpecKey(family, raw) {
  const index = INDEX_BY_FAMILY.get(family)
  if (!index) return null
  return index.get(normalizeSpecText(raw)) ?? null
}
