import {
  BadgeCheck,
  Compass,
  CreditCard,
  Droplets,
  Eye,
  FileCheck,
  Gem,
  Gauge,
  Layers,
  Lock,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Truck,
  Undo2,
  Wrench,
  Watch,
  Zap,
  Calendar,
} from '@lucide/vue'

export const DEFAULT_ICON_PROPS = {
  strokeWidth: 1.75,
}

/** @type {Record<string, import('vue').Component>} */
const SEMANTIC_ICON_REGISTRY = {
  guarantee: FileCheck,
  payment: Lock,
  pickup: Store,
  store: Store,
  shipping: Truck,
  envoi: Truck,
  return: Undo2,
  retour: Undo2,
  experience: Star,
  stock: Layers,
  watch: Watch,
  authentic: Eye,
  shield: ShieldCheck,
  default: ShieldCheck,
  atelier: Wrench,
  workshop: Wrench,
  piles: Zap,
  battery: Zap,
  bracelets: Layers,
  strap: Layers,
  avantages: CreditCard,
  sport: Zap,
  elegance: Sparkles,
  mechanics: Gauge,
  water: Droplets,
  etancheite: Droplets,
  glass: Gem,
  verre: Gem,
  case: Layers,
  boitier: Layers,
  boitiers: Layers,
  functions: Settings,
  fonction: Settings,
  fonctions: Settings,
  compass: Compass,
}

/** Direct Lucide kebab-case or PascalCase names (subset used in config / AppIcon). */
/** @type {Record<string, import('vue').Component>} */
const LUCIDE_DIRECT_REGISTRY = {
  calendar: Calendar,
  'badge-check': BadgeCheck,
  badgecheck: BadgeCheck,
  'shield-check': ShieldCheck,
  shieldcheck: ShieldCheck,
  'file-check': FileCheck,
  filecheck: FileCheck,
  'credit-card': CreditCard,
  creditcard: CreditCard,
}

function normalizeIconKey(name) {
  return String(name ?? '')
    .trim()
    .toLowerCase()
}

/**
 * @param {string | null | undefined} name
 * @returns {import('vue').Component}
 */
export function resolveIcon(name) {
  const key = normalizeIconKey(name)
  if (!key) return SEMANTIC_ICON_REGISTRY.default

  if (SEMANTIC_ICON_REGISTRY[key]) {
    return SEMANTIC_ICON_REGISTRY[key]
  }

  if (LUCIDE_DIRECT_REGISTRY[key]) {
    return LUCIDE_DIRECT_REGISTRY[key]
  }

  return SEMANTIC_ICON_REGISTRY.default
}

export const ICON_REGISTRY = { ...SEMANTIC_ICON_REGISTRY, ...LUCIDE_DIRECT_REGISTRY }
