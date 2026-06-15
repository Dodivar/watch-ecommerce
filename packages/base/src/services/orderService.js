import { getBackendApiUrl, readApiResponseBody } from './backendApiUrl.js'

/** Site actif (build Vite) — évite qu’en local le backend prenne le mauvais site via Origin :5173. */
const SITE_ID = import.meta.env.VITE_SITE_ID || 'sauvage-watches'

function apiHeaders(accessToken) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Site-Id': SITE_ID,
  }
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }
  return headers
}

async function parseJson(response) {
  const data = await readApiResponseBody(response)
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error(
        data.error ||
          data.message ||
          'Trop de requêtes. Patientez quelques instants avant de réessayer.',
      )
    }
    throw new Error(data.error || data.message || 'Erreur serveur')
  }
  return data
}

/**
 * @param {{ lines?: { watchId: string, quantity: number }[], watchIds?: string[] }} payload
 */
export async function createOrder(payload) {
  const response = await fetch(`${getBackendApiUrl()}/api/orders`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(payload),
  })
  return parseJson(response)
}

export async function fetchOrder(orderId, accessToken) {
  const response = await fetch(`${getBackendApiUrl()}/api/orders/${orderId}`, {
    headers: apiHeaders(accessToken),
  })
  return parseJson(response)
}

export async function updateOrderCustomer(orderId, accessToken, body) {
  const response = await fetch(`${getBackendApiUrl()}/api/orders/${orderId}/customer`, {
    method: 'PATCH',
    headers: apiHeaders(accessToken),
    body: JSON.stringify(body),
  })
  return parseJson(response)
}

export async function updateOrderShipping(orderId, accessToken, body) {
  const response = await fetch(`${getBackendApiUrl()}/api/orders/${orderId}/shipping`, {
    method: 'PATCH',
    headers: apiHeaders(accessToken),
    body: JSON.stringify(body),
  })
  return parseJson(response)
}

export async function applyOrderPromo(orderId, accessToken, code) {
  const response = await fetch(`${getBackendApiUrl()}/api/orders/${orderId}/promo`, {
    method: 'POST',
    headers: apiHeaders(accessToken),
    body: JSON.stringify({ code }),
  })
  return parseJson(response)
}

export async function removeOrderPromo(orderId, accessToken) {
  const response = await fetch(`${getBackendApiUrl()}/api/orders/${orderId}/promo`, {
    method: 'POST',
    headers: apiHeaders(accessToken),
    body: JSON.stringify({ remove: true }),
  })
  return parseJson(response)
}

export async function createOrderPayment(orderId, accessToken) {
  const response = await fetch(`${getBackendApiUrl()}/api/orders/${orderId}/pay`, {
    method: 'POST',
    headers: apiHeaders(accessToken),
  })
  return parseJson(response)
}

export async function cancelOrder(orderId, accessToken) {
  const response = await fetch(`${getBackendApiUrl()}/api/orders/${orderId}/cancel`, {
    method: 'POST',
    headers: apiHeaders(accessToken),
  })
  return parseJson(response)
}

export async function verifyOrder(orderId, accessToken) {
  const params = new URLSearchParams({ token: accessToken })
  const response = await fetch(
    `${getBackendApiUrl()}/api/orders/${orderId}/verify?${params.toString()}`,
    { headers: apiHeaders() },
  )
  return response.json()
}

/**
 * Télécharge le reçu PDF d'une commande payée.
 * @param {string} orderId
 * @param {string} accessToken
 */
export async function downloadOrderReceipt(orderId, accessToken) {
  const params = new URLSearchParams({ token: accessToken })
  const response = await fetch(
    `${getBackendApiUrl()}/api/orders/${orderId}/receipt?${params.toString()}`,
    { headers: apiHeaders(accessToken) },
  )
  if (!response.ok) {
    const data = await readApiResponseBody(response)
    throw new Error(data.error || data.message || 'Impossible de télécharger le reçu')
  }
  const blob = await response.blob()
  const filename =
    response.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] ||
    `receipt-${orderId}.pdf`
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
