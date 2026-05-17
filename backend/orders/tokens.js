const crypto = require('crypto')

const DEFAULT_TTL_SECONDS = 60 * 60 * 2 // 2 hours (covers reserve window + checkout)

/**
 * @param {string} token
 * @returns {string}
 */
function hashOrderAccessToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex')
}

/**
 * @param {string} secret
 * @param {string} orderId
 * @param {number} [ttlSeconds]
 * @returns {string}
 */
function signOrderAccessToken(secret, orderId, ttlSeconds = DEFAULT_TTL_SECONDS) {
  if (!secret) {
    throw new Error('PAYMENT_CANCEL_SECRET manquant pour ce site')
  }
  const payload = {
    orderId: String(orderId),
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  }
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url')
  return `${payloadB64}.${sig}`
}

/**
 * @param {string} secret
 * @param {string} token
 * @param {string} orderId
 * @returns {boolean}
 */
function verifyOrderAccessToken(secret, token, orderId) {
  if (!secret || !token || !orderId) {
    return false
  }
  const parts = String(token).split('.')
  if (parts.length !== 2) {
    return false
  }
  const [payloadB64, sig] = parts
  let expected
  try {
    expected = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url')
  } catch {
    return false
  }
  let sigBuf
  let expBuf
  try {
    sigBuf = Buffer.from(sig, 'base64url')
    expBuf = Buffer.from(expected, 'base64url')
  } catch {
    return false
  }
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return false
  }
  let payload
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'))
  } catch {
    return false
  }
  if (!payload || typeof payload.exp !== 'number') {
    return false
  }
  if (payload.exp < Math.floor(Date.now() / 1000)) {
    return false
  }
  return String(payload.orderId) === String(orderId)
}

module.exports = {
  hashOrderAccessToken,
  signOrderAccessToken,
  verifyOrderAccessToken,
  DEFAULT_TTL_SECONDS,
}
