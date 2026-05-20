/**
 * Retrait en boutique au checkout — activation par site (`checkout.shipping.pickupEnabled`).
 * Les méthodes `type: 'pickup'` restent dans le manifest ; elles sont ignorées si le retrait est désactivé.
 */

export function isCheckoutPickupEnabled(checkoutConfig = {}) {
  const explicit = checkoutConfig.shipping?.pickupEnabled
  if (typeof explicit === 'boolean') return explicit
  const methods = checkoutConfig.shipping?.methods || []
  return methods.some((method) => method?.type === 'pickup')
}

export function resolveCheckoutShippingMethods(checkoutConfig = {}) {
  const methods = checkoutConfig.shipping?.methods || []
  if (isCheckoutPickupEnabled(checkoutConfig)) return methods
  return methods.filter((method) => method?.type !== 'pickup')
}

export function resolveCheckoutShipping(checkoutConfig = {}) {
  return {
    pickupEnabled: isCheckoutPickupEnabled(checkoutConfig),
    methods: resolveCheckoutShippingMethods(checkoutConfig),
  }
}
