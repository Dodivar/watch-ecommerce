import { computed, ref } from 'vue'
import { getCurrentAdminRole } from './adminAuthService'
import {
  canAccessPath as canAccessPathForRole,
  canManageUsers as canManageUsersForRole,
  canWrite as canWriteForRole,
  deniedTooltip as deniedTooltipForRole,
} from './adminPermissions'

/**
 * Composable d'accès au rôle admin courant et aux permissions dérivées.
 * Tant que `ready` est false (rôle en cours de résolution), `canWrite` et
 * `canManageUsers` valent false : pas de flash de boutons pour un visiteur.
 * Le guard routeur ayant déjà résolu le rôle, la valeur vient du cache et se
 * résout immédiatement en pratique.
 */
export function useAdminPermissions() {
  const role = ref(null)
  const ready = ref(false)

  getCurrentAdminRole().then((value) => {
    role.value = value
    ready.value = true
  })

  return {
    role,
    ready,
    canWrite: computed(() => canWriteForRole(role.value)),
    canManageUsers: computed(() => canManageUsersForRole(role.value)),
    canAccessPath: (path) => canAccessPathForRole(role.value, path),
    deniedTooltip: (path) => deniedTooltipForRole(role.value, path),
  }
}
