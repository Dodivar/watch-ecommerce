// Service pour gérer l'authentification de maintenance

import { getSiteConfig } from '@/site/getSiteConfig.js'

/** Si absent de `site.config.js` → `maintenance.password`. */
const DEFAULT_MAINTENANCE_PASSWORD = '@sauvagE2025!'

function getMaintenancePassword() {
  const pwd = getSiteConfig().maintenance?.password
  return typeof pwd === 'string' && pwd.length > 0 ? pwd : DEFAULT_MAINTENANCE_PASSWORD
}

function getStorageKey() {
  const siteId = getSiteConfig().siteId || 'site'
  return `maintenance_authenticated_${siteId}`
}

/**
 * Vérifie si le mot de passe de maintenance est correct
 * @param {string} inputPassword - Le mot de passe saisi
 * @returns {boolean} - True si le mot de passe est correct
 */
export function checkMaintenancePassword(inputPassword) {
  return inputPassword === getMaintenancePassword()
}

/**
 * Vérifie si l'utilisateur est authentifié pour accéder au site
 * @returns {boolean} - True si l'utilisateur est authentifié
 */
export function isAuthenticated() {
  const key = getStorageKey()
  // Vérifier dans sessionStorage (perdure pendant la session du navigateur)
  const sessionAuth = sessionStorage.getItem(key)
  if (sessionAuth === 'true') {
    return true
  }

  // Vérifier dans localStorage (perdure même après fermeture du navigateur)
  const localAuth = localStorage.getItem(key)
  if (localAuth === 'true') {
    return true
  }

  return false
}

/**
 * Authentifie l'utilisateur (stocke l'état d'authentification)
 * @param {boolean} remember - Si true, utilise localStorage, sinon sessionStorage
 */
export function authenticate(remember = false) {
  const key = getStorageKey()
  if (remember) {
    localStorage.setItem(key, 'true')
  } else {
    sessionStorage.setItem(key, 'true')
  }
}

/**
 * Déconnecte l'utilisateur (supprime l'état d'authentification)
 */
export function logout() {
  const key = getStorageKey()
  localStorage.removeItem(key)
  sessionStorage.removeItem(key)
}

