<script setup>
import { ref } from 'vue'
import { subscribeToNewsletter } from '@/services/newsletterSignupService.js'

defineProps({
  title: { type: String, default: 'Newsletter' },
  description: {
    type: String,
    default: 'Recevez nos nouveautés et actualités par email.',
  },
})

const email = ref('')
// Pot de miel anti-bot : champ masqué que seul un robot remplit.
const website = ref('')
const status = ref('idle') // idle | loading | success | error
const message = ref('')

async function submit() {
  if (!email.value.trim()) return
  status.value = 'loading'
  message.value = ''
  try {
    await subscribeToNewsletter({ email: email.value.trim(), website: website.value })
    status.value = 'success'
    message.value = 'Merci ! Votre inscription est confirmée.'
    email.value = ''
  } catch (err) {
    status.value = 'error'
    message.value = err.message || "Une erreur est survenue, veuillez réessayer."
  }
}
</script>

<template>
  <section class="newsletter-signup">
    <h3 class="newsletter-signup__title">{{ title }}</h3>
    <p class="newsletter-signup__desc">{{ description }}</p>
    <form class="newsletter-signup__form" @submit.prevent="submit">
      <input
        v-model="website"
        type="text"
        name="website"
        tabindex="-1"
        autocomplete="off"
        aria-hidden="true"
        class="newsletter-signup__hp"
      />
      <input
        v-model="email"
        type="email"
        required
        placeholder="votre@email.fr"
        aria-label="Adresse email"
        class="newsletter-signup__input"
        :disabled="status === 'loading'"
      />
      <button type="submit" class="newsletter-signup__button" :disabled="status === 'loading'">
        {{ status === 'loading' ? 'Envoi…' : "S'inscrire" }}
      </button>
    </form>
    <p
      v-if="message"
      class="newsletter-signup__message"
      :class="status === 'success' ? 'is-success' : 'is-error'"
      role="status"
    >
      {{ message }}
    </p>
    <p class="newsletter-signup__consent">
      En vous inscrivant, vous acceptez de recevoir nos communications par email. Désinscription
      possible à tout moment via le lien présent dans chaque message. Pour en savoir plus, consultez
      notre
      <RouterLink to="/politique-confidentialite" class="newsletter-signup__consent-link">
        politique de confidentialité</RouterLink
      >.
    </p>
  </section>
</template>

<style scoped>
.newsletter-signup {
  max-width: 32rem;
}
.newsletter-signup__title {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
}
.newsletter-signup__desc {
  font-size: 0.875rem;
  opacity: 0.8;
  margin: 0 0 0.75rem;
}
.newsletter-signup__form {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
/* Pot de miel : hors écran (un display:none serait ignoré par certains bots). */
.newsletter-signup__hp {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}
.newsletter-signup__input {
  flex: 1 1 12rem;
  padding: 0.6rem 0.85rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 0.5rem;
  font-size: 0.9rem;
}
.newsletter-signup__button {
  padding: 0.6rem 1.1rem;
  border: none;
  border-radius: 0.5rem;
  background-image: var(--gradient-cta);
  color: var(--color-text-on-dark);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-image 0.2s,
    opacity 0.2s;
}
.newsletter-signup__button:hover:not(:disabled) {
  background-image: var(--gradient-cta-hover);
}
.newsletter-signup__button:disabled {
  opacity: 0.6;
  cursor: default;
}

/*
  Variante pied de page : le bloc est posé sur le vert de marque. Un bouton vert
  y serait invisible — il s'inverse donc en masse beige, et le champ passe en
  verre clair.
*/
.newsletter-signup.newsletter-footer .newsletter-signup__button {
  background-image: linear-gradient(140deg, #ffffff 0%, var(--color-cream) 100%);
  color: var(--color-primary);
}
.newsletter-signup.newsletter-footer .newsletter-signup__button:hover:not(:disabled) {
  background-image: linear-gradient(140deg, #ffffff 0%, var(--color-cream-100) 100%);
}
.newsletter-signup.newsletter-footer .newsletter-signup__input {
  border-color: var(--color-border-on-dark);
}
.newsletter-signup__message {
  margin: 0.6rem 0 0;
  font-size: 0.85rem;
}
.newsletter-signup__message.is-success {
  color: #15803d;
}
.newsletter-signup__message.is-error {
  color: #b91c1c;
}
/* Sur le vert du pied de page, les messages ont besoin de tons clairs. */
.newsletter-signup.newsletter-footer .newsletter-signup__message.is-success {
  color: #86efac;
}
.newsletter-signup.newsletter-footer .newsletter-signup__message.is-error {
  color: #fca5a5;
}
.newsletter-signup__consent {
  margin: 0.6rem 0 0;
  font-size: 0.75rem;
  line-height: 1.4;
  opacity: 0.75;
}
.newsletter-signup__consent-link {
  color: inherit;
  text-decoration: underline;
}
</style>
