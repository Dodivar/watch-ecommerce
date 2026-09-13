<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  Archive,
  ArchiveRestore,
  BadgeEuro,
  CalendarClock,
  ExternalLink,
  Mail,
  MailOpen,
  MessageSquare,
  Paperclip,
  Phone,
  Telescope,
  Watch,
  Wrench,
} from '@lucide/vue'
import { getLeadByIdForAdmin, updateLeadStatus } from '@/services/admin/adminLeadService'
import {
  LEAD_STATUS_LABELS,
  formatLeadSlot,
  formatLeadDate,
  formatLeadDateTime,
  formatLeadPrice,
  formatLeadBudget,
  formatLeadHandling,
  getLeadTypePresentation,
  getLeadWatchLink,
  getUnmappedPayloadKeys,
} from '@/utils/leadDisplay'
import { useAdminPermissions } from '@/services/admin/useAdminPermissions'
import { getCurrentAdminRole } from '@/services/admin/adminAuthService'
import { canWrite as roleCanWrite } from '@/services/admin/adminPermissions'
import AdminShell from './AdminShell.vue'

/** Icônes Lucide du bandeau de type, résolues depuis la table de présentation. */
const TYPE_ICONS = {
  MessageSquare,
  CalendarClock,
  BadgeEuro,
  Telescope,
  Wrench,
}

const { canWrite } = useAdminPermissions()
const route = useRoute()
const leadId = computed(() => route.params.id)
const lead = ref(null)
const isLoading = ref(true)
const isSaving = ref(false)
const error = ref(null)

const payload = computed(() => lead.value?.payload || {})
const watchLink = computed(() => (lead.value ? getLeadWatchLink(lead.value) : null))
const unmappedKeys = computed(() => (lead.value ? getUnmappedPayloadKeys(payload.value) : []))
const presentation = computed(() => getLeadTypePresentation(lead.value?.type))
const typeIcon = computed(() => TYPE_ICONS[presentation.value.icon] || MessageSquare)

/** Qui écrit : le nom en tête de page, l'email en secours. */
const contactName = computed(
  () =>
    lead.value?.customerName ||
    payload.value.name ||
    lead.value?.customerEmail ||
    payload.value.email ||
    'Contact sans nom',
)
const email = computed(() => lead.value?.customerEmail || payload.value.email || null)
const tel = computed(() => payload.value.tel || null)

/**
 * Une ligne de fiche, ignorée si la donnée est absente : les formulaires n'ont
 * pas tous les mêmes champs, et une liste trouée se lit moins bien qu'une
 * liste courte.
 *
 * @param {string} label
 * @param {unknown} value
 */
function field(label, value) {
  if (value == null || value === '' || value === '—') return null
  return { label, value }
}

const contactFields = computed(() =>
  [
    field('Prénom', lead.value?.type !== 'contact' ? payload.value.nickname : null),
    field('Nom', lead.value?.customerName || payload.value.name),
    field('Préférence de contact', payload.value.contact_mode),
  ].filter(Boolean),
)

/** Blocs propres au type de demande, dans l'ordre où on les lit. */
const requestSections = computed(() => {
  if (!lead.value) return []
  const p = payload.value
  const sections = []

  if (lead.value.type === 'appointment') {
    sections.push({
      key: 'appointment',
      title: 'Rendez-vous',
      icon: CalendarClock,
      fields: [
        field('Date', formatLeadDate(p.date)),
        field('Créneau', p.time_slot ? formatLeadSlot(p.time_slot) : null),
      ],
    })
  }

  if (lead.value.type === 'repair') {
    sections.push({
      key: 'repair',
      title: 'Demande atelier',
      icon: Wrench,
      fields: [
        field('Prestation', p.service_type),
        field('Prise en charge', p.handling ? formatLeadHandling(p.handling) : null),
        field('Marque', p.brand),
        field('Modèle', p.model),
        field('Page d’origine', p.source),
      ],
    })
  }

  if (lead.value.type === 'estimation') {
    sections.push({
      key: 'estimation',
      title: 'Détails de la montre',
      icon: BadgeEuro,
      fields: [
        field('Marque', p.brand),
        field('Modèle', p.model),
        field('Numéro de série', p.serienumber),
        field('Année', p.year),
        field('État général', p.etat || p.condition),
        field('État de possession', p.possession),
      ],
    })
  }

  if (lead.value.type === 'search') {
    sections.push({
      key: 'search',
      title: 'Critères de recherche',
      icon: Telescope,
      fields: [
        field('Marque', p.brand),
        field('Modèle', p.model),
        field(
          'Budget',
          p.budget_min || p.budget_max ? formatLeadBudget(p.budget_min, p.budget_max) : null,
        ),
        field('État souhaité', p.condition),
        field('Délai souhaité', p.delai),
      ],
    })
  }

  return sections
    .map((section) => ({ ...section, fields: section.fields.filter(Boolean) }))
    .filter((section) => section.fields.length > 0)
})

const watchFields = computed(() =>
  [
    field('Modèle', payload.value.watch_name),
    field(
      'Prix affiché',
      payload.value.watch_price ? formatLeadPrice(payload.value.watch_price) : null,
    ),
  ].filter(Boolean),
)

const showWatchSection = computed(
  () => watchFields.value.length > 0 || Boolean(watchLink.value) || Boolean(lead.value?.watchId),
)

const statusClass = computed(() => {
  if (lead.value?.status === 'new') return 'bg-primary/10 text-primary font-semibold'
  if (lead.value?.status === 'archived') return 'bg-gray-100 text-gray-600'
  return 'bg-cream-200 text-gray-700'
})

async function load() {
  try {
    isLoading.value = true
    lead.value = await getLeadByIdForAdmin(leadId.value)
    if (!lead.value) error.value = 'Message introuvable'
    else if (lead.value.status === 'new' && roleCanWrite(await getCurrentAdminRole())) {
      // Marquage « lu » automatique — pas pour un compte lecture seule (RLS).
      await updateLeadStatus(leadId.value, 'read')
      lead.value = { ...lead.value, status: 'read' }
    }
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

/**
 * Le statut est appliqué localement plutôt que rechargé : un rechargement
 * repasserait par le marquage automatique et annulerait un « marquer non lu ».
 *
 * @param {'new' | 'read' | 'archived'} status
 */
async function setStatus(status) {
  if (isSaving.value) return
  isSaving.value = true
  try {
    await updateLeadStatus(leadId.value, status)
    lead.value = { ...lead.value, status }
  } catch (err) {
    error.value = err.message
  } finally {
    isSaving.value = false
  }
}

onMounted(load)
</script>

<template>
  <AdminShell
    title="Message"
    show-back-button
    back-button-route="/admin/leads"
    back-button-text="Messages"
    content-class="max-w-5xl"
  >
    <div v-if="error" class="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4">{{ error }}</div>
    <div v-if="isLoading" class="text-center py-12 text-gray-500">Chargement…</div>

    <template v-else-if="lead">
      <!-- Bandeau : type, statut, date de réception — l'identité du message
           avant son contenu. -->
      <div
        class="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
      >
        <span
          class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
          :class="presentation.chip"
        >
          <component :is="typeIcon" class="h-5 w-5" :stroke-width="2" />
        </span>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="text-lg font-semibold text-text-main">{{ contactName }}</h2>
            <span
              class="rounded-full border px-2 py-0.5 text-xs font-medium"
              :class="presentation.chip"
            >
              {{ presentation.label }}
            </span>
            <span
              class="rounded-full px-2 py-0.5 text-xs uppercase tracking-wide"
              :class="statusClass"
            >
              {{ LEAD_STATUS_LABELS[lead.status] || lead.status }}
            </span>
          </div>
          <p class="mt-0.5 text-sm text-gray-500">
            Reçu le {{ formatLeadDateTime(lead.createdAt) }}
          </p>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-3 lg:items-start">
        <!-- Colonne principale : la demande elle-même. -->
        <div class="space-y-6 lg:col-span-2">
          <section
            v-for="section in requestSections"
            :key="section.key"
            class="rounded-xl border border-gray-100 bg-white shadow-sm"
          >
            <h3
              class="flex items-center gap-2 border-b border-gray-100 px-5 py-3 text-sm font-semibold text-text-main"
            >
              <component :is="section.icon" class="h-4 w-4 text-gray-400" :stroke-width="2" />
              {{ section.title }}
            </h3>
            <dl class="divide-y divide-gray-50">
              <div
                v-for="item in section.fields"
                :key="item.label"
                class="flex gap-4 px-5 py-2.5 text-sm"
              >
                <dt class="w-40 shrink-0 text-gray-500">{{ item.label }}</dt>
                <dd class="min-w-0 flex-1 text-text-main">{{ item.value }}</dd>
              </div>
            </dl>
          </section>

          <section
            v-if="payload.message"
            class="rounded-xl border border-gray-100 bg-white shadow-sm"
          >
            <h3
              class="flex items-center gap-2 border-b border-gray-100 px-5 py-3 text-sm font-semibold text-text-main"
            >
              <MessageSquare class="h-4 w-4 text-gray-400" :stroke-width="2" />
              Message
            </h3>
            <p class="whitespace-pre-wrap px-5 py-4 text-sm leading-relaxed text-gray-700">
              {{ payload.message }}
            </p>
          </section>

          <section
            v-if="showWatchSection"
            class="rounded-xl border border-gray-100 bg-white shadow-sm"
          >
            <h3
              class="flex items-center gap-2 border-b border-gray-100 px-5 py-3 text-sm font-semibold text-text-main"
            >
              <Watch class="h-4 w-4 text-gray-400" :stroke-width="2" />
              Montre concernée
            </h3>
            <dl class="divide-y divide-gray-50">
              <div
                v-for="item in watchFields"
                :key="item.label"
                class="flex gap-4 px-5 py-2.5 text-sm"
              >
                <dt class="w-40 shrink-0 text-gray-500">{{ item.label }}</dt>
                <dd class="min-w-0 flex-1 text-text-main">{{ item.value }}</dd>
              </div>
            </dl>
            <div
              v-if="watchLink || lead.watchId"
              class="flex flex-wrap gap-2 border-t border-gray-100 px-5 py-3"
            >
              <a
                v-if="watchLink"
                :href="watchLink"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-cream/60"
              >
                <ExternalLink class="h-4 w-4" :stroke-width="2" />
                Voir la fiche produit
              </a>
              <RouterLink
                v-if="lead.watchId"
                :to="`/admin/watches/${lead.watchId}/edit`"
                class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-cream/60"
              >
                Modifier en admin
              </RouterLink>
            </div>
          </section>

          <section
            v-if="payload.attachments?.length"
            class="rounded-xl border border-gray-100 bg-white shadow-sm"
          >
            <h3
              class="flex items-center gap-2 border-b border-gray-100 px-5 py-3 text-sm font-semibold text-text-main"
            >
              <Paperclip class="h-4 w-4 text-gray-400" :stroke-width="2" />
              Pièces jointes
              <span class="text-xs font-normal text-gray-400"
                >({{ payload.attachments.length }})</span
              >
            </h3>
            <ul class="divide-y divide-gray-50">
              <li
                v-for="(file, index) in payload.attachments"
                :key="index"
                class="px-5 py-2.5 text-sm text-gray-700"
              >
                {{ file.name || file }}
              </li>
            </ul>
          </section>

          <details
            v-if="unmappedKeys.length"
            class="rounded-xl border border-gray-100 bg-white shadow-sm"
          >
            <summary class="cursor-pointer px-5 py-3 text-sm font-medium text-gray-600">
              Données techniques
              <span class="text-xs font-normal text-gray-400">({{ unmappedKeys.length }})</span>
            </summary>
            <dl class="divide-y divide-gray-50 border-t border-gray-100">
              <div v-for="key in unmappedKeys" :key="key" class="flex gap-4 px-5 py-2.5 text-sm">
                <dt class="w-40 shrink-0 break-words text-gray-500">{{ key }}</dt>
                <dd class="min-w-0 flex-1 break-words text-text-main">{{ payload[key] }}</dd>
              </div>
            </dl>
          </details>
        </div>

        <!-- Colonne latérale : qui écrit, et quoi en faire. Reste sous les yeux
             pendant la lecture d'un long message. -->
        <aside class="space-y-4 lg:sticky lg:top-4">
          <section class="rounded-xl border border-gray-100 bg-white shadow-sm">
            <h3 class="border-b border-gray-100 px-5 py-3 text-sm font-semibold text-text-main">
              Contact
            </h3>
            <dl class="divide-y divide-gray-50">
              <div v-for="item in contactFields" :key="item.label" class="px-5 py-2.5 text-sm">
                <dt class="text-xs uppercase tracking-wide text-gray-400">{{ item.label }}</dt>
                <dd class="mt-0.5 break-words text-text-main">{{ item.value }}</dd>
              </div>
              <div v-if="email" class="px-5 py-2.5 text-sm">
                <dt class="text-xs uppercase tracking-wide text-gray-400">Email</dt>
                <dd class="mt-0.5 break-words">
                  <a :href="`mailto:${email}`" class="text-primary underline">{{ email }}</a>
                </dd>
              </div>
              <div v-if="tel" class="px-5 py-2.5 text-sm">
                <dt class="text-xs uppercase tracking-wide text-gray-400">Téléphone</dt>
                <dd class="mt-0.5">
                  <a :href="`tel:${tel}`" class="text-primary underline">{{ tel }}</a>
                </dd>
              </div>
            </dl>
            <p
              v-if="!email && !tel && contactFields.length === 0"
              class="px-5 py-4 text-sm text-gray-500"
            >
              Aucune coordonnée transmise.
            </p>
          </section>

          <section class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <h3 class="mb-3 text-sm font-semibold text-text-main">Actions</h3>
            <div class="space-y-2">
              <a
                v-if="email"
                :href="`mailto:${email}`"
                class="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
              >
                <Mail class="h-4 w-4" :stroke-width="2" />
                Répondre par email
              </a>
              <a
                v-if="tel"
                :href="`tel:${tel}`"
                class="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-cream/60"
              >
                <Phone class="h-4 w-4" :stroke-width="2" />
                Appeler
              </a>
              <button
                v-if="canWrite && lead.status !== 'new'"
                type="button"
                class="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-cream/60 disabled:opacity-50"
                :disabled="isSaving"
                @click="setStatus('new')"
              >
                <MailOpen class="h-4 w-4" :stroke-width="2" />
                Marquer non lu
              </button>
              <button
                v-if="canWrite && lead.status !== 'archived'"
                type="button"
                class="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-cream/60 disabled:opacity-50"
                :disabled="isSaving"
                @click="setStatus('archived')"
              >
                <Archive class="h-4 w-4" :stroke-width="2" />
                Archiver
              </button>
              <button
                v-if="canWrite && lead.status === 'archived'"
                type="button"
                class="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-cream/60 disabled:opacity-50"
                :disabled="isSaving"
                @click="setStatus('read')"
              >
                <ArchiveRestore class="h-4 w-4" :stroke-width="2" />
                Désarchiver
              </button>
            </div>
          </section>
        </aside>
      </div>
    </template>
  </AdminShell>
</template>
