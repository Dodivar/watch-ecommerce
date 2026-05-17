/**
 * @deprecated Stripe Checkout hébergé a été remplacé par le checkout personnalisé.
 * Utiliser `@/services/orderService.js` pour les commandes et le Payment Element.
 */

export async function createCheckoutSession() {
  throw new Error('Stripe Checkout n’est plus utilisé. Passez par /checkout.')
}

export async function createCheckoutSessionFromCart() {
  throw new Error('Stripe Checkout n’est plus utilisé. Passez par /checkout.')
}

export async function verifyPaymentSession() {
  return {
    valid: false,
    reason: 'Les sessions Stripe Checkout ne sont plus supportées',
  }
}
