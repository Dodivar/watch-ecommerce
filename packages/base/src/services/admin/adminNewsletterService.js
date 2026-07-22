import { supabase } from '../supabase'
import { getBackendApiUrl, readApiResponseBody } from '../backendApiUrl.js'
import { getSiteConfig } from '../../site/getSiteConfig.js'
import { getAdminSiteId } from './adminSiteContext.js'

export const CAMPAIGN_STATUSES = ['draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled']

/**
 * Appel authentifié vers le backend (envoi / import — service role + Mailjet).
 * @param {string} path
 * @param {object} [body]
 */
async function callBackend(path, body = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('Session admin requise')

  const siteId = getAdminSiteId()
  const response = await fetch(`${getBackendApiUrl()}/api/newsletter${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Site-Id': siteId,
    },
    body: JSON.stringify(body),
  })

  const data = await readApiResponseBody(response)
  if (!response.ok || data.success === false) {
    throw new Error(data.error || data.message || "Échec de l'opération")
  }
  return data
}

// ---------------------------------------------------------------------------
// Abonnés
// ---------------------------------------------------------------------------
function mapSubscriber(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    status: row.status,
    source: row.source,
    consentAt: row.consent_at,
    unsubscribedAt: row.unsubscribed_at,
    createdAt: row.created_at,
  }
}

/**
 * @param {{ status?: string, search?: string, limit?: number, offset?: number }} [filters]
 */
export async function getSubscribers(filters = {}) {
  const siteId = getAdminSiteId()
  let query = supabase
    .from('newsletter_subscribers')
    .select('*', { count: 'exact' })
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.search?.trim()) {
    // Retirer les caractères réservés de la grammaire or() PostgREST (',', '(', ')')
    // qui feraient échouer la requête entière.
    const term = `%${filters.search.trim().replace(/[,()]/g, ' ')}%`
    query = query.or(`email.ilike.${term},name.ilike.${term}`)
  }

  const limit = filters.limit ?? 50
  const offset = filters.offset ?? 0
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)
  return { subscribers: (data || []).map(mapSubscriber), total: count ?? 0 }
}

/** Compte des abonnés actifs (pour l'aperçu du public). */
export async function getSubscribedCount() {
  const siteId = getAdminSiteId()
  const { count, error } = await supabase
    .from('newsletter_subscribers')
    .select('*', { count: 'exact', head: true })
    .eq('site_id', siteId)
    .eq('status', 'subscribed')
  if (error) throw new Error(error.message)
  return count ?? 0
}

/**
 * @param {{ email: string, name?: string }} input
 */
export async function addSubscriber(input) {
  const siteId = getAdminSiteId()
  const email = String(input.email || '').trim().toLowerCase()
  if (!email) throw new Error('Email requis')

  const { error } = await supabase.from('newsletter_subscribers').insert({
    site_id: siteId,
    email,
    name: input.name?.trim() || null,
    status: 'subscribed',
    source: 'manual',
    consent_at: new Date().toISOString(),
  })
  if (error) throw new Error(error.message)
  return { success: true }
}

/** @param {string} id */
export async function deleteSubscriber(id) {
  const siteId = getAdminSiteId()
  const { error } = await supabase
    .from('newsletter_subscribers')
    .delete()
    .eq('id', id)
    .eq('site_id', siteId)
  if (error) throw new Error(error.message)
  return { success: true }
}

// ---------------------------------------------------------------------------
// Campagnes
// ---------------------------------------------------------------------------
function mapCampaign(row) {
  return {
    id: row.id,
    subject: row.subject,
    bodyHtml: row.body_html,
    status: row.status,
    recipientCount: row.recipient_count,
    sentCount: row.sent_count,
    createdBy: row.created_by,
    scheduledAt: row.scheduled_at,
    sentAt: row.sent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * @param {{ status?: string }} [filters]
 */
export async function getCampaigns(filters = {}) {
  const siteId = getAdminSiteId()
  let query = supabase
    .from('newsletter_campaigns')
    .select('*')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
  if (filters.status) query = query.eq('status', filters.status)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data || []).map(mapCampaign)
}

/** @param {string} id */
export async function getCampaign(id) {
  const siteId = getAdminSiteId()
  const { data, error } = await supabase
    .from('newsletter_campaigns')
    .select('*')
    .eq('id', id)
    .eq('site_id', siteId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? mapCampaign(data) : null
}

/**
 * @param {{ subject: string, bodyHtml: string }} input
 */
export async function createCampaign(input) {
  const siteId = getAdminSiteId()
  const { data, error } = await supabase
    .from('newsletter_campaigns')
    .insert({
      site_id: siteId,
      subject: input.subject?.trim() || '',
      body_html: input.bodyHtml || '',
      status: 'draft',
    })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return mapCampaign(data)
}

/**
 * @param {string} id
 * @param {{ subject?: string, bodyHtml?: string }} input
 */
export async function updateCampaign(id, input) {
  const siteId = getAdminSiteId()
  const patch = { updated_at: new Date().toISOString() }
  if (input.subject !== undefined) patch.subject = input.subject.trim()
  if (input.bodyHtml !== undefined) patch.body_html = input.bodyHtml

  const { data, error } = await supabase
    .from('newsletter_campaigns')
    .update(patch)
    .eq('id', id)
    .eq('site_id', siteId)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return mapCampaign(data)
}

/** @param {string} id */
export async function deleteCampaign(id) {
  const siteId = getAdminSiteId()
  const { error } = await supabase
    .from('newsletter_campaigns')
    .delete()
    .eq('id', id)
    .eq('site_id', siteId)
  if (error) throw new Error(error.message)
  return { success: true }
}

/**
 * Journal des destinataires d'une campagne (rapport d'envoi).
 * @param {string} campaignId
 * @returns {Promise<{ email: string, status: string, error: string|null, sentAt: string|null }[]>}
 */
export async function getCampaignRecipients(campaignId) {
  const siteId = getAdminSiteId()
  const { data, error } = await supabase
    .from('newsletter_campaign_recipients')
    .select('email, status, error, sent_at')
    .eq('campaign_id', campaignId)
    .eq('site_id', siteId)
    .order('email')
  if (error) throw new Error(error.message)
  return (data || []).map((r) => ({
    email: r.email,
    status: r.status,
    error: r.error,
    sentAt: r.sent_at,
  }))
}

/**
 * Envoie une campagne à l'ensemble des abonnés opt-in (via backend).
 * @param {string} id
 */
export async function sendCampaign(id) {
  return callBackend(`/campaigns/${id}/send`, {})
}

/**
 * Envoie un email de test à une adresse (via backend).
 * @param {string} id
 * @param {string} testEmail
 */
export async function sendTestCampaign(id, testEmail) {
  return callBackend(`/campaigns/${id}/send`, { testEmail })
}

/**
 * Programme l'envoi d'une campagne à une date/heure donnée. L'envoi effectif est
 * déclenché par la boucle de planification du backend une fois l'échéance atteinte.
 * @param {string} id
 * @param {string} scheduledAtIso  Date ISO (UTC)
 */
export async function scheduleCampaign(id, scheduledAtIso) {
  const siteId = getAdminSiteId()
  const when = new Date(scheduledAtIso)
  if (Number.isNaN(when.getTime())) throw new Error("Date d'envoi invalide")
  if (when.getTime() <= Date.now()) throw new Error("La date d'envoi doit être dans le futur")

  const { data, error } = await supabase
    .from('newsletter_campaigns')
    .update({
      status: 'scheduled',
      scheduled_at: when.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('site_id', siteId)
    .in('status', ['draft', 'cancelled'])
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return mapCampaign(data)
}

/**
 * Annule la programmation d'une campagne (statut « annulée »).
 * @param {string} id
 */
export async function cancelScheduledCampaign(id) {
  const siteId = getAdminSiteId()
  const { data, error } = await supabase
    .from('newsletter_campaigns')
    .update({
      status: 'cancelled',
      scheduled_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('site_id', siteId)
    .eq('status', 'scheduled')
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return mapCampaign(data)
}

// ---------------------------------------------------------------------------
// Réglages (en-tête / pied de page de marque)
// ---------------------------------------------------------------------------
/**
 * Valeurs par défaut dérivées du manifest client (marque, couleur d'accent).
 */
export function defaultSettings() {
  const site = getSiteConfig()
  const brandName = site?.brand?.legalName || site?.brand?.displayName || ''
  const logoText = site?.brand?.displayName ? String(site.brand.displayName).toUpperCase() : ''
  return {
    logoText,
    accentColor: site?.theme?.colors?.primary || '#d4af37',
    headerHtml: '',
    footerHtml: '',
    senderName: brandName,
    replyTo: '',
  }
}

export async function getSettings() {
  const siteId = getAdminSiteId()
  const { data, error } = await supabase
    .from('newsletter_settings')
    .select('*')
    .eq('site_id', siteId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return { ...defaultSettings(), _isNew: true }
  return {
    logoText: data.logo_text ?? '',
    accentColor: data.accent_color ?? defaultSettings().accentColor,
    headerHtml: data.header_html ?? '',
    footerHtml: data.footer_html ?? '',
    senderName: data.sender_name ?? '',
    replyTo: data.reply_to ?? '',
  }
}

/**
 * @param {{ logoText, accentColor, headerHtml, footerHtml, senderName, replyTo }} input
 */
export async function saveSettings(input) {
  const siteId = getAdminSiteId()
  const { error } = await supabase.from('newsletter_settings').upsert(
    {
      site_id: siteId,
      logo_text: input.logoText || null,
      accent_color: input.accentColor || null,
      header_html: input.headerHtml || null,
      footer_html: input.footerHtml || null,
      sender_name: input.senderName || null,
      reply_to: input.replyTo || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'site_id' },
  )
  if (error) throw new Error(error.message)
  return { success: true }
}
