<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  Archive,
  ArchiveRestore,
  BadgeEuro,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronRight,
  Inbox,
  LayoutList,
  Mail,
  MailOpen,
  MessageSquare,
  Phone,
  Search,
  Telescope,
  Wrench,
  X,
} from '@lucide/vue'
import {
  getLeadsForAdmin,
  getAppointmentsByDate,
  getUnreadLeadsCountByType,
  updateLeadStatus,
  LEAD_TYPES,
} from '@/services/admin/adminLeadService'
import {
  LEAD_STATUS_LABELS,
  formatLeadSlot,
  formatLeadTime,
  getLeadSummary,
  getLeadTypePresentation,
  groupLeadsByDay,
  matchesLeadSearch,
  organizeAppointmentsByDate,
} from '@/utils/leadDisplay'
import { useAdminPermissions } from '@/services/admin/useAdminPermissions'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import AdminShell from './AdminShell.vue'

/** Nombre de messages ajoutés à chaque « Afficher plus ». */
const PAGE_SIZE = 25

/** Icônes Lucide, résolues depuis le nom porté par la table de présentation. */
const TYPE_ICONS = {
  MessageSquare,
  CalendarClock,
  BadgeEuro,
  Telescope,
  Wrench,
}

const STATUS_FILTERS = [
  { value: 'new', label: 'Non lus' },
  { value: 'read', label: 'Lus' },
  { value: 'archived', label: 'Archivés' },
  { value: '', label: 'Tous' },
]

const site = getSiteConfig()
const router = useRouter()
const { canWrite } = useAdminPermissions()

const activeLeadTypes = computed(() => {
  const { features } = site
  const isRetail = site.watchCatalog?.isRetail ?? site.watchCatalog?.mode !== 'resale'

  return LEAD_TYPES.filter((type) => {
    switch (type) {
      case 'contact':
        return features.contact
      case 'appointment':
        return (site.watchCatalog?.appointmentEnabled ?? isRetail) && features.collection
      case 'estimation':
        return features.estimation
      case 'search':
        return features.recherche
      case 'repair':
        return features.repairRequest
      default:
        return false
    }
  })
})

const showAppointmentCalendar = computed(() => activeLeadTypes.value.includes('appointment'))

const leads = ref([])
const appointmentsByDate = ref({})
const unreadByType = ref(Object.fromEntries(LEAD_TYPES.map((t) => [t, 0])))
const isLoading = ref(true)
const error = ref(null)
const pendingLeadId = ref(null)

const statusFilter = ref('new')
const typeFilter = ref('all')
const searchTerm = ref('')
const view = ref('list')
const visibleCount = ref(PAGE_SIZE)

/** Messages du statut courant qui passent le filtre de type puis la recherche. */
const filteredLeads = computed(() =>
  leads.value.filter(
    (lead) =>
      (typeFilter.value === 'all' || lead.type === typeFilter.value) &&
      matchesLeadSearch(lead, searchTerm.value),
  ),
)

const visibleLeads = computed(() => filteredLeads.value.slice(0, visibleCount.value))
const groupedLeads = computed(() => groupLeadsByDay(visibleLeads.value))
const hasMore = computed(() => filteredLeads.value.length > visibleLeads.value.length)

/** Compteurs des onglets : nombre de messages du statut courant, par type. */
const countByType = computed(() => {
  const counts = Object.fromEntries(activeLeadTypes.value.map((t) => [t, 0]))
  for (const lead of leads.value) {
    if (counts[lead.type] != null) counts[lead.type]++
  }
  return counts
})

const totalUnread = computed(() =>
  activeLeadTypes.value.reduce((sum, type) => sum + (unreadByType.value[type] || 0), 0),
)

const subtitle = computed(() => {
  if (isLoading.value) return ''
  if (totalUnread.value === 0) return 'Aucun message non lu'
  return `${totalUnread.value} message${totalUnread.value > 1 ? 's' : ''} non lu${totalUnread.value > 1 ? 's' : ''}`
})

const hasActiveFilters = computed(
  () =>
    typeFilter.value !== 'all' || searchTerm.value.trim() !== '' || statusFilter.value !== 'new',
)

const agenda = computed(() => organizeAppointmentsByDate(appointmentsByDate.value))

const typeTabs = computed(() => [
  { value: 'all', label: 'Tous', count: leads.value.length, unread: totalUnread.value },
  ...activeLeadTypes.value.map((type) => ({
    value: type,
    label: getLeadTypePresentation(type).label,
    count: countByType.value[type] || 0,
    unread: unreadByType.value[type] || 0,
  })),
])

function typeIcon(type) {
  return TYPE_ICONS[getLeadTypePresentation(type).icon] || MessageSquare
}

function contactName(lead) {
  return lead.customerName || lead.customerEmail || 'Contact sans nom'
}

/** Ligne secondaire : email et téléphone, séparés seulement s'ils existent. */
function contactDetails(lead) {
  const email = lead.customerEmail || lead.payload?.email
  const tel = lead.payload?.tel
  return [email, tel].filter(Boolean)
}

function leadEmail(lead) {
  return lead.customerEmail || lead.payload?.email || null
}

async function load() {
  try {
    isLoading.value = true
    error.value = null
    visibleCount.value = PAGE_SIZE

    const requests = [
      getLeadsForAdmin({ status: statusFilter.value || undefined, limit: 1000 }),
      getUnreadLeadsCountByType(),
    ]
    if (showAppointmentCalendar.value) requests.push(getAppointmentsByDate())

    const [listResult, unreadCounts, appts] = await Promise.all(requests)
    leads.value = listResult.leads
    unreadByType.value = unreadCounts
    appointmentsByDate.value = appts || {}
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

function selectStatus(value) {
  if (statusFilter.value === value) return
  statusFilter.value = value
  load()
}

function selectType(value) {
  typeFilter.value = value
  visibleCount.value = PAGE_SIZE
}

function resetFilters() {
  typeFilter.value = 'all'
  searchTerm.value = ''
  if (statusFilter.value !== 'new') selectStatus('new')
}

// Un filtre resserré puis élargi ne doit pas conserver la pagination précédente.
watch(searchTerm, () => {
  visibleCount.value = PAGE_SIZE
})

/**
 * Change le statut d'un message depuis la liste. La ligne disparaît quand elle
 * ne correspond plus au statut filtré : le tri « Non lus » reste une pile qui
 * se vide au fur et à mesure du traitement.
 */
async function setStatus(lead, status) {
  if (!canWrite.value || pendingLeadId.value) return
  pendingLeadId.value = lead.id
  try {
    await updateLeadStatus(lead.id, status)
    const previous = lead.status

    if (statusFilter.value && statusFilter.value !== status) {
      leads.value = leads.value.filter((item) => item.id !== lead.id)
    } else {
      leads.value = leads.value.map((item) => (item.id === lead.id ? { ...item, status } : item))
    }

    const delta = (previous === 'new' ? -1 : 0) + (status === 'new' ? 1 : 0)
    if (delta !== 0) {
      unreadByType.value = {
        ...unreadByType.value,
        [lead.type]: Math.max(0, (unreadByType.value[lead.type] || 0) + delta),
      }
    }
  } catch (err) {
    error.value = err.message
  } finally {
    pendingLeadId.value = null
  }
}

onMounted(load)
</script>

<template>
  <AdminShell title="Messages entrants" :subtitle="subtitle">
    <div
      v-if="error"
      class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4"
    >
      {{ error }}
    </div>

    <div
      v-if="activeLeadTypes.length === 0"
      class="rounded-xl border border-gray-100 bg-white p-8 text-center text-gray-500 shadow-sm"
    >
      Aucun type de message n'est activé pour ce site.
    </div>

    <template v-else>
      <!-- Barre de tri : type, puis statut et recherche. Un seul endroit pour
           réduire la pile, au lieu d'accordéons à ouvrir un par un. -->
      <div class="mb-6 rounded-xl border border-gray-100 bg-white shadow-sm">
        <div
          v-if="view === 'list'"
          class="flex flex-wrap items-center gap-2 border-b border-gray-100 px-3 py-3"
        >
          <button
            v-for="tab in typeTabs"
            :key="tab.value"
            type="button"
            class="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors"
            :class="
              typeFilter === tab.value
                ? 'border-primary bg-primary text-white font-semibold'
                : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-cream/60'
            "
            :aria-pressed="typeFilter === tab.value"
            @click="selectType(tab.value)"
          >
            <component
              :is="tab.value === 'all' ? Inbox : typeIcon(tab.value)"
              class="h-4 w-4 shrink-0"
              :stroke-width="2"
            />
            <span>{{ tab.label }}</span>
            <span
              class="rounded-full px-1.5 text-xs tabular-nums"
              :class="
                typeFilter === tab.value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
              "
            >
              {{ tab.count }}
            </span>
            <span
              v-if="statusFilter !== 'new' && tab.unread > 0"
              class="h-1.5 w-1.5 rounded-full bg-primary"
              :title="`${tab.unread} non lu(s)`"
            />
          </button>
        </div>

        <div class="flex flex-col gap-3 px-3 py-3 lg:flex-row lg:items-center">
          <p v-if="view === 'agenda'" class="text-sm text-gray-500">
            Rendez-vous non archivés, du plus proche au plus lointain.
          </p>
          <div
            v-if="view === 'list'"
            class="inline-flex rounded-lg border border-gray-200 p-0.5"
            role="group"
            aria-label="Statut"
          >
            <button
              v-for="option in STATUS_FILTERS"
              :key="option.value"
              type="button"
              class="rounded-md px-3 py-1.5 text-sm transition-colors"
              :class="
                statusFilter === option.value
                  ? 'bg-cream-200 font-semibold text-text-main'
                  : 'text-gray-600 hover:bg-cream/60'
              "
              :aria-pressed="statusFilter === option.value"
              @click="selectStatus(option.value)"
            >
              {{ option.label }}
            </button>
          </div>

          <div v-if="view === 'list'" class="relative flex-1 min-w-[200px]">
            <Search
              class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              :stroke-width="2"
            />
            <input
              v-model="searchTerm"
              type="search"
              placeholder="Nom, email, téléphone, marque…"
              class="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm"
              aria-label="Rechercher un message"
            />
          </div>

          <div
            v-if="showAppointmentCalendar"
            class="inline-flex rounded-lg border border-gray-200 p-0.5 lg:ml-auto"
            role="group"
            aria-label="Affichage"
          >
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors"
              :class="
                view === 'list'
                  ? 'bg-cream-200 font-semibold text-text-main'
                  : 'text-gray-600 hover:bg-cream/60'
              "
              :aria-pressed="view === 'list'"
              @click="view = 'list'"
            >
              <LayoutList class="h-4 w-4" :stroke-width="2" />
              Liste
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors"
              :class="
                view === 'agenda'
                  ? 'bg-cream-200 font-semibold text-text-main'
                  : 'text-gray-600 hover:bg-cream/60'
              "
              :aria-pressed="view === 'agenda'"
              @click="view = 'agenda'"
            >
              <CalendarDays class="h-4 w-4" :stroke-width="2" />
              Agenda RDV
            </button>
          </div>
        </div>
      </div>

      <div v-if="isLoading" class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div
          v-for="i in 5"
          :key="i"
          class="animate-pulse border-b border-gray-100 py-4 last:border-0"
        >
          <div class="h-4 w-1/3 rounded bg-gray-100" />
          <div class="mt-2 h-3 w-2/3 rounded bg-gray-100" />
        </div>
      </div>

      <!-- Agenda : les rendez-vous rangés par date, à venir d'abord. -->
      <template v-else-if="view === 'agenda'">
        <div
          v-if="agenda.upcoming.length === 0 && agenda.past.length === 0"
          class="rounded-xl border border-gray-100 bg-white p-8 text-center text-gray-500 shadow-sm"
        >
          Aucun rendez-vous enregistré.
        </div>
        <div v-else class="space-y-6">
          <section v-if="agenda.upcoming.length" class="space-y-3">
            <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500">À venir</h2>
            <div
              v-for="day in agenda.upcoming"
              :key="day.date"
              class="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
            >
              <div class="flex items-center gap-2 border-b border-gray-100 bg-amber-50 px-4 py-2.5">
                <CalendarClock class="h-4 w-4 text-amber-700" :stroke-width="2" />
                <h3 class="text-sm font-semibold capitalize text-amber-900">{{ day.label }}</h3>
                <span class="ml-auto text-xs text-amber-800">{{ day.items.length }} RDV</span>
              </div>
              <ul class="divide-y divide-gray-100">
                <li
                  v-for="appointment in day.items"
                  :key="appointment.id"
                  class="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm hover:bg-cream/50"
                  @click="router.push(`/admin/leads/${appointment.id}`)"
                >
                  <span class="w-24 shrink-0 font-medium text-text-main">
                    {{ formatLeadSlot(appointment.payload?.time_slot) }}
                  </span>
                  <span class="font-medium text-text-main">{{ contactName(appointment) }}</span>
                  <span v-if="appointment.payload?.watch_name" class="text-gray-600">
                    · {{ appointment.payload.watch_name }}
                  </span>
                  <span
                    v-if="appointment.status === 'new'"
                    class="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary"
                  >
                    Non lu
                  </span>
                </li>
              </ul>
            </div>
          </section>

          <section v-if="agenda.past.length" class="space-y-3">
            <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500">Passés</h2>
            <details
              v-for="day in agenda.past"
              :key="day.date"
              class="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
            >
              <summary class="cursor-pointer px-4 py-3 text-sm text-gray-600">
                <span class="font-medium capitalize text-text-main">{{ day.label }}</span>
                <span class="ml-2 text-gray-500">· {{ day.items.length }} RDV</span>
              </summary>
              <ul class="divide-y divide-gray-100 border-t border-gray-100">
                <li
                  v-for="appointment in day.items"
                  :key="appointment.id"
                  class="flex cursor-pointer flex-wrap items-center gap-x-3 px-4 py-3 text-sm hover:bg-cream/50"
                  @click="router.push(`/admin/leads/${appointment.id}`)"
                >
                  <span class="w-24 shrink-0 text-gray-500">
                    {{ formatLeadSlot(appointment.payload?.time_slot) }}
                  </span>
                  <span class="text-text-main">{{ contactName(appointment) }}</span>
                  <span v-if="appointment.payload?.watch_name" class="text-gray-600">
                    · {{ appointment.payload.watch_name }}
                  </span>
                </li>
              </ul>
            </details>
          </section>
        </div>
      </template>

      <div
        v-else-if="filteredLeads.length === 0"
        class="rounded-xl border border-gray-100 bg-white p-10 text-center shadow-sm"
      >
        <Inbox class="mx-auto h-8 w-8 text-gray-300" :stroke-width="1.5" />
        <p class="mt-3 text-sm text-gray-500">
          {{
            hasActiveFilters
              ? 'Aucun message ne correspond à ces filtres.'
              : 'Aucun message pour le moment.'
          }}
        </p>
        <button
          v-if="hasActiveFilters"
          type="button"
          class="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-cream/60"
          @click="resetFilters"
        >
          <X class="h-4 w-4" :stroke-width="2" />
          Réinitialiser les filtres
        </button>
      </div>

      <!-- Liste unifiée, du plus récent au plus ancien, coupée par journée. -->
      <div v-else class="space-y-5">
        <section v-for="group in groupedLeads" :key="group.key">
          <h2 class="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {{ group.label }}
          </h2>
          <!-- Séparateurs portés par chaque ligne, pas par `divide-y` : celui-ci
               repeint aussi le liseré gauche qui signale un message non lu. -->
          <ul class="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
            <li
              v-for="lead in group.leads"
              :key="lead.id"
              class="relative flex flex-wrap items-start gap-x-3 gap-y-2 border-b border-l-2 border-b-gray-100 px-4 py-3 transition-colors last:border-b-0 hover:bg-cream/50"
              :class="
                lead.status === 'new' ? 'border-l-primary bg-primary/5' : 'border-l-transparent'
              "
            >
              <span
                class="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
                :class="getLeadTypePresentation(lead.type).chip"
                :title="getLeadTypePresentation(lead.type).label"
              >
                <component :is="typeIcon(lead.type)" class="h-4 w-4" :stroke-width="2" />
              </span>

              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <!-- Lien étendu : toute la ligne ouvre le message, sans
                       imbriquer de bouton dans un bouton. -->
                  <RouterLink
                    :to="`/admin/leads/${lead.id}`"
                    class="truncate text-sm text-text-main after:absolute after:inset-0 after:content-['']"
                    :class="lead.status === 'new' ? 'font-semibold' : 'font-medium'"
                  >
                    {{ contactName(lead) }}
                  </RouterLink>
                  <span
                    class="rounded-full border px-2 py-0.5 text-[11px] font-medium"
                    :class="getLeadTypePresentation(lead.type).chip"
                  >
                    {{ getLeadTypePresentation(lead.type).label }}
                  </span>
                  <span
                    v-if="lead.status === 'archived'"
                    class="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600"
                  >
                    {{ LEAD_STATUS_LABELS.archived }}
                  </span>
                </div>
                <p class="mt-0.5 truncate text-sm text-gray-600">{{ getLeadSummary(lead) }}</p>
                <p v-if="contactDetails(lead).length" class="mt-0.5 truncate text-xs text-gray-400">
                  <span v-for="(detail, index) in contactDetails(lead)" :key="detail">
                    <span v-if="index > 0" aria-hidden="true"> · </span>{{ detail }}
                  </span>
                </p>
              </div>

              <div class="relative flex w-full shrink-0 items-center justify-end gap-1 sm:w-auto">
                <time class="mr-1 text-xs tabular-nums text-gray-500" :datetime="lead.createdAt">
                  {{ formatLeadTime(lead.createdAt) }}
                </time>
                <a
                  v-if="leadEmail(lead)"
                  :href="`mailto:${leadEmail(lead)}`"
                  class="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-cream-100 hover:text-gray-900"
                  title="Répondre par email"
                  @click.stop
                >
                  <Mail class="h-4 w-4" :stroke-width="2" />
                  <span class="sr-only">Répondre à {{ contactName(lead) }}</span>
                </a>
                <a
                  v-if="lead.payload?.tel"
                  :href="`tel:${lead.payload.tel}`"
                  class="hidden rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-cream-100 hover:text-gray-900 sm:inline-flex"
                  title="Appeler"
                  @click.stop
                >
                  <Phone class="h-4 w-4" :stroke-width="2" />
                  <span class="sr-only">Appeler {{ contactName(lead) }}</span>
                </a>
                <button
                  v-if="canWrite && lead.status === 'new'"
                  type="button"
                  class="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-cream-100 hover:text-gray-900 disabled:opacity-40"
                  :disabled="pendingLeadId === lead.id"
                  title="Marquer comme lu"
                  @click.stop="setStatus(lead, 'read')"
                >
                  <Check class="h-4 w-4" :stroke-width="2" />
                  <span class="sr-only">Marquer comme lu</span>
                </button>
                <button
                  v-else-if="canWrite && lead.status === 'read'"
                  type="button"
                  class="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-cream-100 hover:text-gray-900 disabled:opacity-40"
                  :disabled="pendingLeadId === lead.id"
                  title="Marquer comme non lu"
                  @click.stop="setStatus(lead, 'new')"
                >
                  <MailOpen class="h-4 w-4" :stroke-width="2" />
                  <span class="sr-only">Marquer comme non lu</span>
                </button>
                <button
                  v-if="canWrite && lead.status !== 'archived'"
                  type="button"
                  class="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-cream-100 hover:text-gray-900 disabled:opacity-40"
                  :disabled="pendingLeadId === lead.id"
                  title="Archiver"
                  @click.stop="setStatus(lead, 'archived')"
                >
                  <Archive class="h-4 w-4" :stroke-width="2" />
                  <span class="sr-only">Archiver</span>
                </button>
                <button
                  v-else-if="canWrite"
                  type="button"
                  class="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-cream-100 hover:text-gray-900 disabled:opacity-40"
                  :disabled="pendingLeadId === lead.id"
                  title="Désarchiver"
                  @click.stop="setStatus(lead, 'read')"
                >
                  <ArchiveRestore class="h-4 w-4" :stroke-width="2" />
                  <span class="sr-only">Désarchiver</span>
                </button>
                <ChevronRight class="h-4 w-4 text-gray-300" :stroke-width="2" aria-hidden="true" />
              </div>
            </li>
          </ul>
        </section>

        <div class="flex flex-col items-center gap-2 pt-1">
          <p class="text-sm text-gray-500">
            {{ visibleLeads.length }} sur {{ filteredLeads.length }} message{{
              filteredLeads.length > 1 ? 's' : ''
            }}
          </p>
          <button
            v-if="hasMore"
            type="button"
            class="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-cream/60"
            @click="visibleCount += PAGE_SIZE"
          >
            Afficher plus
          </button>
        </div>
      </div>
    </template>
  </AdminShell>
</template>
