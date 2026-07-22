import { supabase } from '../supabase'

const STORAGE_KEY = 'admin_authenticated'

// Cache module du rôle de l'utilisateur connecté (évite une requête par navigation).
let roleCache = { email: null, role: null }

function clearRoleCache() {
  roleCache = { email: null, role: null }
}

/**
 * Récupère la ligne admin_users (email + rôle) d'un email autorisé.
 * @param {string} email
 * @returns {Promise<{email: string, role: string}|null>} null si non autorisé
 */
async function fetchAdminRow(email) {
  try {
    let { data, error } = await supabase
      .from('admin_users')
      .select('email, role')
      .eq('email', email)
      .single()

    // Tenant pré-migration rôles : colonne absente, retomber sur email seul.
    if (error && error.code !== 'PGRST116' && /role/.test(error.message || '')) {
      ;({ data, error } = await supabase
        .from('admin_users')
        .select('email')
        .eq('email', email)
        .single())
    }

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('Erreur lors de la vérification admin:', error)
      }
      return null
    }

    if (!data) return null
    return { email: data.email, role: data.role || 'admin' }
  } catch (error) {
    console.error('Erreur dans fetchAdminRow:', error)
    return null
  }
}

/**
 * Vérifie si un email est dans la liste des admins autorisés
 * @param {string} email - L'email à vérifier
 * @returns {Promise<boolean>} - True si l'email est autorisé
 */
async function isAuthorizedAdmin(email) {
  const row = await fetchAdminRow(email)
  if (row) {
    roleCache = { email, role: row.role }
  }
  return !!row
}

/**
 * Rôle de l'utilisateur admin connecté (`admin`, `moderator` ou `visitor`).
 * @returns {Promise<string|null>} null si non connecté ou non autorisé
 */
export async function getCurrentAdminRole() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const email = session?.user?.email
    if (!email) return null

    if (roleCache.email === email && roleCache.role) {
      return roleCache.role
    }

    const row = await fetchAdminRow(email)
    if (!row) return null
    roleCache = { email, role: row.role }
    return row.role
  } catch (error) {
    console.error('Erreur dans getCurrentAdminRole:', error)
    return null
  }
}

/**
 * Connecte un utilisateur admin avec email et mot de passe
 * @param {string} email - L'email de l'utilisateur
 * @param {string} password - Le mot de passe
 * @param {boolean} remember - Si true, utilise localStorage pour persister la session, sinon sessionStorage
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function loginAdmin(email, password, remember = false) {
  try {
    clearRoleCache()
    // Authentifier avec Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      return {
        success: false,
        error: authError.message || 'Erreur lors de la connexion',
      }
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Aucun utilisateur trouvé',
      }
    }

    // Vérifier que l'email est dans la liste des admins autorisés
    const isAuthorized = await isAuthorizedAdmin(email)
    if (!isAuthorized) {
      // Déconnecter l'utilisateur s'il n'est pas autorisé
      await supabase.auth.signOut()
      return {
        success: false,
        error: 'Vous n\'êtes pas autorisé à accéder à l\'interface d\'administration',
      }
    }

    // Stocker l'état d'authentification selon le choix de l'utilisateur
    if (remember) {
      localStorage.setItem(STORAGE_KEY, 'true')
      localStorage.setItem('admin_email', email)
      // Nettoyer sessionStorage pour éviter les conflits
      sessionStorage.removeItem(STORAGE_KEY)
    } else {
      sessionStorage.setItem(STORAGE_KEY, 'true')
      localStorage.setItem('admin_email', email)
      // Nettoyer localStorage pour éviter les conflits
      localStorage.removeItem(STORAGE_KEY)
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Erreur dans loginAdmin:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la connexion',
    }
  }
}

// Réponse volontairement identique quel que soit le résultat réel de l'envoi
// (anti-énumération d'emails).
const GENERIC_RESET_MESSAGE =
  'Si un compte existe pour cette adresse, un email de réinitialisation a été envoyé.'

/**
 * Demande un email de réinitialisation de mot de passe admin. Le lien reçu
 * atterrit sur /admin/set-password (même mécanique que le lien d'invitation).
 * @param {string} email
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export async function requestAdminPasswordReset(email) {
  const trimmed = (email || '').trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { success: false, error: 'Veuillez saisir une adresse email valide' }
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${window.location.origin}/admin/set-password`,
    })

    if (error) {
      // Le rate-limit est signalé : le taire ferait croire à un envoi réussi.
      if (error.status === 429 || /security purposes|rate limit/i.test(error.message || '')) {
        return {
          success: false,
          error: 'Trop de demandes. Veuillez patienter une minute avant de réessayer.',
        }
      }
      console.error('Erreur resetPasswordForEmail:', error)
    }

    return { success: true, message: GENERIC_RESET_MESSAGE }
  } catch (error) {
    console.error('Erreur dans requestAdminPasswordReset:', error)
    return { success: true, message: GENERIC_RESET_MESSAGE }
  }
}

/**
 * Vérifie si l'utilisateur admin est actuellement authentifié
 * @returns {Promise<boolean>} - True si l'utilisateur est authentifié et autorisé
 */
export async function isAdminAuthenticated() {
  try {
    // Vérifier la session Supabase
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session || !session.user) {
      return false
    }

    // Vérifier dans sessionStorage (session temporaire)
    const sessionAuth = sessionStorage.getItem(STORAGE_KEY)
    // Vérifier dans localStorage (session persistante)
    const localAuth = localStorage.getItem(STORAGE_KEY)
    
    // Si aucune des deux n'est présente, l'utilisateur n'est pas authentifié
    if (sessionAuth !== 'true' && localAuth !== 'true') {
      return false
    }

    // Vérifier que l'email est toujours autorisé (au cas où il aurait été retiré)
    const isAuthorized = await isAuthorizedAdmin(session.user.email)
    if (!isAuthorized) {
      // Déconnecter si plus autorisé
      await logoutAdmin()
      return false
    }

    return true
  } catch (error) {
    console.error('Erreur dans isAdminAuthenticated:', error)
    return false
  }
}

/**
 * Récupère l'utilisateur admin actuellement connecté
 * @returns {Promise<Object|null>} - Les données de l'utilisateur ou null
 */
export async function getCurrentAdmin() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    return user
  } catch (error) {
    console.error('Erreur dans getCurrentAdmin:', error)
    return null
  }
}

/**
 * Marque la session admin comme active (après login ou définition du mot de
 * passe via un lien d'invitation).
 * @param {string} email
 * @param {boolean} remember - true : localStorage (persistant), false : sessionStorage
 */
export function markAdminAuthenticated(email, remember = true) {
  if (remember) {
    localStorage.setItem(STORAGE_KEY, 'true')
    sessionStorage.removeItem(STORAGE_KEY)
  } else {
    sessionStorage.setItem(STORAGE_KEY, 'true')
    localStorage.removeItem(STORAGE_KEY)
  }
  localStorage.setItem('admin_email', email)
}

/**
 * Déconnecte l'utilisateur admin
 */
export async function logoutAdmin() {
  try {
    clearRoleCache()
    await supabase.auth.signOut()
    sessionStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem('admin_email')
  } catch (error) {
    console.error('Erreur dans logoutAdmin:', error)
  }
}

/**
 * Vérifie et met à jour la session admin (à appeler périodiquement)
 * @returns {Promise<boolean>} - True si la session est valide
 */
export async function refreshAdminSession() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error || !session) {
      sessionStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(STORAGE_KEY)
      return false
    }

    // Vérifier que l'email est toujours autorisé
    const isAuthorized = await isAuthorizedAdmin(session.user.email)
    if (!isAuthorized) {
      await logoutAdmin()
      return false
    }

    // Mettre à jour le flag d'authentification selon le type de session
    const localAuth = localStorage.getItem(STORAGE_KEY)
    if (localAuth === 'true') {
      localStorage.setItem(STORAGE_KEY, 'true')
    } else {
      sessionStorage.setItem(STORAGE_KEY, 'true')
    }
    return true
  } catch (error) {
    console.error('Erreur dans refreshAdminSession:', error)
    return false
  }
}

