<template>
  <section id="faq" class="py-12">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-10">
        <h2 v-if="heading" class="text-3xl lg:text-4xl font-bold text-text-main mb-3">{{ heading }}</h2>
        <p v-if="subheading" class="text-xl text-gray-600">{{ subheading }}</p>
      </div>
      <div class="space-y-2">
        <div v-for="item in faqItems" :key="item.id" class="bg-white rounded-md shadow-sm">
          <button
            class="w-full text-left p-6 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset faq-button"
            @click="toggleFaq(item.id)"
          >
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-semibold">{{ item.question }}</h3>
              <svg
                class="h-5 w-5 transform transition-transform duration-300 ease-out"
                :class="{ 'rotate-180': activeFaqId === item.id }"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </button>
          <div
            class="faq-content overflow-hidden"
            :style="{
              height: activeFaqId === item.id ? `${contentHeights[item.id]}px` : '0px',
            }"
          >
            <div
              :ref="(el) => setContentRef(el, item.id)"
              class="px-6 pb-6"
              v-html="item.answer"
              @click="onFaqAnswerClick"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { getSiteConfig } from '@/site/getSiteConfig.js'

const router = useRouter()

const site = getSiteConfig()
const faqConfig = site.faq || {}
const heading = faqConfig.heading
const subheading = faqConfig.subheading
const faqItems = computed(() => (Array.isArray(faqConfig.items) ? faqConfig.items : []))

const activeFaqId = ref(null)
const contentHeights = ref({})
const contentRefs = ref({})

const setContentRef = (el, id) => {
  if (el) {
    contentRefs.value[id] = el
    // Calculer la hauteur réelle du contenu
    nextTick(() => {
      if (el) {
        contentHeights.value[id] = el.scrollHeight
      }
    })
  }
}

/**
 * Le contenu FAQ vient de chaînes HTML (`v-html`) : pas de `<RouterLink>` possible dans la config.
 * Les `<a href="/...">` vers le même site sont converties en navigation SPA.
 */
function onFaqAnswerClick(event) {
  const anchor = event.target.closest('a')
  if (!anchor || anchor.hasAttribute('download')) return

  const hrefAttr = anchor.getAttribute('href')
  if (!hrefAttr || hrefAttr === '#') return

  if (anchor.target === '_blank' || /\bnoopener\b|\bnoreferrer\b/i.test(anchor.rel || '')) {
    return
  }
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
    return
  }

  // Ancre sur la page courante (#contact, etc.) — comportement natif
  if (hrefAttr.startsWith('#') && !hrefAttr.startsWith('#/')) return

  let target = hrefAttr

  if (/^https?:\/\//i.test(hrefAttr)) {
    try {
      const url = new URL(hrefAttr)
      if (url.origin !== window.location.origin) return
      target = `${url.pathname}${url.search}${url.hash}`
    } catch {
      return
    }
  } else if (!hrefAttr.startsWith('/')) {
    return
  }

  event.preventDefault()
  router.push(target)
}

const toggleFaq = async (id) => {
  // Si on ouvre une FAQ, calculer la hauteur si nécessaire
  if (activeFaqId.value !== id) {
    await nextTick()
    const contentEl = contentRefs.value[id]
    if (contentEl && !contentHeights.value[id]) {
      contentHeights.value[id] = contentEl.scrollHeight
    }
  }
  activeFaqId.value = activeFaqId.value === id ? null : id
}

// Calculer les hauteurs au montage du composant
onMounted(async () => {
  await nextTick()
  faqItems.value.forEach((item) => {
    const contentEl = contentRefs.value[item.id]
    if (contentEl) {
      contentHeights.value[item.id] = contentEl.scrollHeight
    }
  })
})
</script>

<script>
export default {
  name: 'FaqSection',
}
</script>

<style scoped>
.faq-content {
  transition: height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: height;
}

.faq-button {
  transition: background-color 0.2s ease-in-out;
}

.faq-button:hover {
  background-color: rgba(0, 0, 0, 0.02);
}
</style>

<!--
  Ce composant doit être importé et utilisé comme <FaqSection /> dans les autres fichiers.
-->
