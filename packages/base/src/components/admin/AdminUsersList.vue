<script setup>
import { computed, onMounted, ref } from 'vue'
import { Trash2, UserPlus, ShieldCheck, ScrollText } from '@lucide/vue'
import {
  getAdminUsersList,
  inviteAdminUser,
  updateAdminUserRole,
  updateAdminUserAccess,
  deleteAdminUser,
} from '@/services/admin/adminUserService'
import { getCurrentAdmin } from '@/services/admin/adminAuthService'
import { getAccessLogForAdmin } from '@/services/admin/adminAccessLogService'
import { ADMIN_ROLES, ROLE_LABELS } from '@/services/admin/adminPermissions'
import AdminShell from './AdminShell.vue'

const users = ref([])
const isLoading = ref(true)
const error = ref(null)
const success = ref(null)
const currentEmail = ref('')

// Invitation
const inviteEmail = ref('')
const inviteRole = ref('moderator')
const isInviting = ref(false)

// Changement de rôle / suppression
const updatingEmail = ref(null)
const showDeleteConfirm = ref(false)
const userToDelete = ref(null)
const isDeleting = ref(false)

// Fenêtre d'accès support (break-glass) et journal
const accessEmail = ref(null)
const accessLog = ref([])
const accessLogAvailable = ref(true)
const isLoadingLog = ref(true)
const ACCESS_HOURS = 72

const ROLE_BADGE_CLASSES = {
  admin: 'bg-primary/10 text-primary',
  moderator: 'bg-gray-100 text-gray-700',
  visitor: 'bg-amber-50 text-amber-700',
}

const adminCount = computed(
  () => users.value.filter((u) => u.role === 'admin').length,
)

const isSelf = (user) => user.email.toLowerCase() === currentEmail.value.toLowerCase()
const isLastAdmin = (user) => user.role === 'admin' && adminCount.value <= 1

const dateTimeFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

/** @param {string|null} value */
const formatDateTime = (value) => (value ? dateTimeFormatter.format(new Date(value)) : '')

/**
 * Un accès est ouvert s'il est actif et non expiré. Un compte du client
 * (`accessExpiresAt` null) est ouvert en permanence : la fenêtre ne concerne
 * que les comptes de support.
 */
const isAccessOpen = (user) => {
  if (user.isActive === false) return false
  if (!user.accessExpiresAt) return true
  return new Date(user.accessExpiresAt).getTime() > Date.now()
}

const accessLabel = (user) => {
  if (!isAccessOpen(user)) return 'Accès fermé'
  if (!user.accessExpiresAt) return 'Accès permanent'
  return `Ouvert jusqu’au ${formatDateTime(user.accessExpiresAt)}`
}

const rowLockReason = (user) => {
  if (isSelf(user)) return 'Vous ne pouvez pas modifier votre propre compte'
  if (isLastAdmin(user)) return 'Dernier administrateur : rétrogradation et suppression impossibles'
  return ''
}

const loadUsers = async () => {
  try {
    users.value = await getAdminUsersList()
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

const loadAccessLog = async () => {
  isLoadingLog.value = true
  try {
    const result = await getAccessLogForAdmin({ limit: 50 })
    accessLog.value = result.entries
    accessLogAvailable.value = result.available
  } catch (err) {
    error.value = err.message
  } finally {
    isLoadingLog.value = false
  }
}

onMounted(async () => {
  const admin = await getCurrentAdmin()
  currentEmail.value = admin?.email || ''
  await Promise.all([loadUsers(), loadAccessLog()])
})

/**
 * Ouvre ou referme la fenêtre d'accès d'un compte support.
 * @param {{ email: string }} user
 * @param {boolean} open
 */
const handleAccessChange = async (user, open) => {
  error.value = null
  success.value = null
  accessEmail.value = user.email
  try {
    await updateAdminUserAccess(user.email, { open, hours: ACCESS_HOURS })
    success.value = open
      ? `Accès de ${user.email} ouvert pour ${ACCESS_HOURS} h.`
      : `Accès de ${user.email} refermé.`
    await Promise.all([loadUsers(), loadAccessLog()])
  } catch (err) {
    error.value = err.message
  } finally {
    accessEmail.value = null
  }
}

const handleInvite = async () => {
  error.value = null
  success.value = null
  isInviting.value = true
  try {
    const result = await inviteAdminUser(inviteEmail.value.trim(), inviteRole.value)
    success.value = result.invited
      ? `Invitation envoyée à ${inviteEmail.value.trim()} — l’utilisateur recevra un email pour définir son mot de passe.`
      : `${inviteEmail.value.trim()} avait déjà un compte : l’accès a été ajouté sans nouvel email.`
    inviteEmail.value = ''
    inviteRole.value = 'moderator'
    await loadUsers()
  } catch (err) {
    error.value = err.message
  } finally {
    isInviting.value = false
  }
}

const handleRoleChange = async (user, event) => {
  const newRole = event.target.value
  if (newRole === user.role) return
  error.value = null
  success.value = null
  updatingEmail.value = user.email
  try {
    await updateAdminUserRole(user.email, newRole)
    success.value = `Rôle de ${user.email} mis à jour : ${ROLE_LABELS[newRole]}.`
    await loadUsers()
  } catch (err) {
    error.value = err.message
    // Revenir à la valeur précédente dans le select.
    event.target.value = user.role
  } finally {
    updatingEmail.value = null
  }
}

const handleDelete = (user) => {
  userToDelete.value = user
  showDeleteConfirm.value = true
}

const cancelDelete = () => {
  showDeleteConfirm.value = false
  userToDelete.value = null
}

const confirmDelete = async () => {
  if (!userToDelete.value) return
  error.value = null
  success.value = null
  isDeleting.value = true
  try {
    await deleteAdminUser(userToDelete.value.email)
    success.value = `L’accès de ${userToDelete.value.email} a été supprimé.`
    showDeleteConfirm.value = false
    userToDelete.value = null
    await loadUsers()
  } catch (err) {
    error.value = err.message
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <AdminShell title="Utilisateurs admin" content-class="max-w-3xl">
    <div v-if="error" class="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4">{{ error }}</div>
    <div v-if="success" class="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4">
      {{ success }}
    </div>

    <!-- Invitation -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="flex items-center gap-2 text-lg font-semibold text-text-main mb-4">
        <UserPlus class="w-5 h-5 text-primary" :stroke-width="1.75" />
        Inviter un utilisateur
      </h2>
      <form class="flex flex-col sm:flex-row gap-3" @submit.prevent="handleInvite">
        <input
          v-model="inviteEmail"
          type="email"
          required
          placeholder="email@example.com"
          class="flex-1 px-4 py-2.5 rounded-lg border-2 border-gray-300 focus:border-primary focus:outline-none transition-colors text-text-main"
          :disabled="isInviting"
        />
        <select
          v-model="inviteRole"
          class="px-4 py-2.5 rounded-lg border-2 border-gray-300 focus:border-primary focus:outline-none transition-colors text-text-main bg-white"
          :disabled="isInviting"
        >
          <option v-for="r in ADMIN_ROLES" :key="r" :value="r">{{ ROLE_LABELS[r] }}</option>
        </select>
        <button
          type="submit"
          :disabled="isInviting"
          class="px-5 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isInviting ? 'Envoi…' : 'Envoyer l’invitation' }}
        </button>
      </form>
      <p class="mt-3 text-sm text-gray-500">
        L’utilisateur recevra un email avec un lien pour définir son mot de passe.
      </p>
    </div>

    <!-- Liste -->
    <div class="bg-white rounded-lg shadow divide-y">
      <div v-if="isLoading" class="p-6 text-center text-gray-500">Chargement…</div>
      <template v-else>
        <div
          v-for="user in users"
          :key="user.email"
          class="flex flex-wrap items-center gap-3 p-4"
        >
          <div class="flex-1 min-w-0">
            <p class="font-medium text-text-main truncate">
              {{ user.email }}
              <span v-if="isSelf(user)" class="text-xs text-gray-400">(vous)</span>
            </p>
            <span
              class="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium"
              :class="ROLE_BADGE_CLASSES[user.role] || ROLE_BADGE_CLASSES.moderator"
            >
              {{ ROLE_LABELS[user.role] || user.role }}
            </span>
            <span
              v-if="user.role === 'visitor'"
              class="inline-block mt-1 ml-2 px-2 py-0.5 rounded-full text-xs font-medium"
              :class="isAccessOpen(user) ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'"
            >
              {{ accessLabel(user) }}
            </span>
          </div>
          <button
            v-if="user.role === 'visitor'"
            type="button"
            :disabled="accessEmail === user.email || isSelf(user)"
            class="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-text-main hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            @click="handleAccessChange(user, !isAccessOpen(user))"
          >
            {{ isAccessOpen(user) ? 'Refermer l’accès' : `Ouvrir ${ACCESS_HOURS} h` }}
          </button>
          <select
            :value="user.role"
            :disabled="isSelf(user) || isLastAdmin(user) || updatingEmail === user.email"
            :title="rowLockReason(user) || 'Changer le rôle'"
            class="px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-text-main bg-white focus:border-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            @change="handleRoleChange(user, $event)"
          >
            <option v-for="r in ADMIN_ROLES" :key="r" :value="r">{{ ROLE_LABELS[r] }}</option>
          </select>
          <button
            type="button"
            :disabled="isSelf(user) || isLastAdmin(user)"
            :title="rowLockReason(user) || 'Supprimer l’accès'"
            class="p-2 text-gray-400 hover:text-red-600 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-gray-400"
            aria-label="Supprimer l’accès"
            @click="handleDelete(user)"
          >
            <Trash2 class="w-4 h-4" :stroke-width="1.75" />
          </button>
        </div>
        <div v-if="users.length === 0" class="p-6 text-center text-gray-500">
          Aucun utilisateur ou accès refusé.
        </div>
      </template>
    </div>

    <!-- Accès support -->
    <div class="bg-white rounded-lg shadow p-6 mt-6">
      <h2 class="flex items-center gap-2 text-lg font-semibold text-text-main mb-2">
        <ShieldCheck class="w-5 h-5 text-primary" :stroke-width="1.75" />
        Accès support
      </h2>
      <p class="text-sm text-gray-600">
        Un compte « Visiteur » est en lecture seule : il ne peut rien créer, modifier ni
        supprimer, et les données personnelles de vos clients (nom, adresse, téléphone, email)
        lui sont masquées. Son accès reste fermé tant que vous ne l’ouvrez pas, et se referme
        seul au bout de {{ ACCESS_HOURS }} heures.
      </p>
    </div>

    <!-- Journal d'accès -->
    <div class="bg-white rounded-lg shadow mt-6">
      <div class="p-6 pb-3">
        <h2 class="flex items-center gap-2 text-lg font-semibold text-text-main">
          <ScrollText class="w-5 h-5 text-primary" :stroke-width="1.75" />
          Journal d’accès
        </h2>
        <p class="mt-1 text-sm text-gray-600">
          Chaque consultation d’un compte support est enregistrée ici.
        </p>
      </div>

      <div v-if="isLoadingLog" class="p-6 pt-0 text-gray-500">Chargement…</div>
      <div v-else-if="!accessLogAvailable" class="p-6 pt-0 text-gray-500">
        Journal indisponible : la migration d’accès support n’est pas encore appliquée sur ce
        site.
      </div>
      <div v-else-if="accessLog.length === 0" class="p-6 pt-0 text-gray-500">
        Aucun accès enregistré.
      </div>
      <div v-else class="divide-y max-h-96 overflow-y-auto">
        <div
          v-for="entry in accessLog"
          :key="entry.id"
          class="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-6 py-2.5 text-sm"
        >
          <span class="text-gray-500 tabular-nums">{{ formatDateTime(entry.occurredAt) }}</span>
          <span class="font-medium text-text-main truncate">{{ entry.email }}</span>
          <span class="text-gray-600">{{ entry.action }}</span>
          <span v-if="entry.path" class="text-gray-400 truncate">{{ entry.path }}</span>
        </div>
      </div>
    </div>

    <!-- Confirmation de suppression -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="cancelDelete"
    >
      <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4" @click.stop>
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Confirmer la suppression</h3>
        <p class="text-gray-600 mb-6">
          Êtes-vous sûr de vouloir retirer l’accès de
          <strong>{{ userToDelete?.email }}</strong> ? Cette action est irréversible.
        </p>
        <div class="flex justify-end space-x-4">
          <button
            class="px-4 py-2 text-gray-700 bg-cream-100 rounded-lg hover:bg-cream-200 transition-colors"
            :disabled="isDeleting"
            @click="cancelDelete"
          >
            Annuler
          </button>
          <button
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            :disabled="isDeleting"
            @click="confirmDelete"
          >
            {{ isDeleting ? 'Suppression…' : 'Supprimer' }}
          </button>
        </div>
      </div>
    </div>
  </AdminShell>
</template>
