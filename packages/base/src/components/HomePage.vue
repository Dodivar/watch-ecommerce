<script setup>
import { computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@vueuse/head'
import { scrollAnimation } from '@/animation'
import { BASE_URL } from '@/config'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { filterHomeSectionsByFeatures } from '@/site/homeSections.js'

import CarouselNouvelles from './CarouselNouvelles.vue'
import CarouselVentes from './CarouselVentes.vue'
import SuivezNous from './SuivezNous.vue'
import FaqSection from './Faq.vue'
import HomeCarouselSection from './home/HomeCarouselSection.vue'
import HomeHeroSection from './home/HomeHeroSection.vue'
import HomeTrustSection from './home/HomeTrustSection.vue'
import HomeServicesSection from './home/HomeServicesSection.vue'
import HomeSelectionsSection from './home/HomeSelectionsSection.vue'
import HomeCollectionHighlightSection from './home/HomeCollectionHighlightSection.vue'
import HomeStatsSection from './home/HomeStatsSection.vue'
import HomeAboutPreviewSection from './home/HomeAboutPreviewSection.vue'

const SECTION_COMPONENTS = {
  homeCarousel: HomeCarouselSection,
  hero: HomeHeroSection,
  nouvelles: CarouselNouvelles,
  selections: HomeSelectionsSection,
  collectionHighlight: HomeCollectionHighlightSection,
  stats: HomeStatsSection,
  aboutPreview: HomeAboutPreviewSection,
  trust: HomeTrustSection,
  ventes: CarouselVentes,
  suivezNous: SuivezNous,
  services: HomeServicesSection,
  faq: FaqSection,
}

const site = getSiteConfig()
const seo = site.seo.home

const resolvedSections = computed(() =>
  filterHomeSectionsByFeatures(site.home.sections, site.features, site),
)

const route = useRoute()

useHead({
  title: seo.title,
  meta: [
    {
      name: 'description',
      content: seo.metaDescription,
    },
    {
      property: 'og:title',
      content: seo.ogTitle,
    },
    {
      property: 'og:description',
      content: seo.ogDescription,
    },
    {
      property: 'og:url',
      content: BASE_URL,
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image',
    },
    {
      name: 'twitter:title',
      content: seo.twitterTitle,
    },
    {
      name: 'twitter:description',
      content: seo.twitterDescription,
    },
  ],
  link: [
    {
      rel: 'canonical',
      href: BASE_URL,
    },
  ],
})

const scrollToHash = async () => {
  if (route.hash) {
    await nextTick()

    const element = document.querySelector(route.hash)
    if (element) {
      const yOffset = -20
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'instant' })
    }
  }
}

const forceScrollToHash = async (hash) => {
  if (!hash) return

  await nextTick()

  const element = document.querySelector(hash)
  if (element) {
    const yOffset = -20
    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
    window.scrollTo({ top: y, behavior: 'smooth' })
  }
}

let handleAnchorClick = null

function parallaxOnScroll() {
  const parallaxElements = document.querySelectorAll('.parallax-object')
  parallaxElements.forEach(function (element) {
    const scrollPosition = window.scrollY
    const speed = Number(element.dataset.scrollSpeed)
    element.style.transform = 'translateY(' + scrollPosition * 0.5 * speed + 'px)'
  })
}

onMounted(async () => {
  scrollAnimation()

  window.addEventListener('scroll', parallaxOnScroll)

  await scrollToHash()

  handleAnchorClick = (e) => {
    const target = e.target.closest('a')
    if (!target) return

    const href = target.getAttribute('href') || target.getAttribute('to')
    if (!href) return

    if (!href.includes('#')) return

    let hash = null
    if (href.startsWith('#')) {
      hash = href
    } else if (href.startsWith('/#')) {
      hash = '#' + href.substring(2)
    } else if (href.includes('#')) {
      hash = '#' + href.split('#')[1]
    }

    if (!hash) return

    if (route.path === '/') {
      if (route.hash === hash) {
        e.preventDefault()
        e.stopPropagation()
        forceScrollToHash(hash)
      }
    }
  }

  document.addEventListener('click', handleAnchorClick)
})

onUnmounted(() => {
  window.removeEventListener('scroll', parallaxOnScroll)
  if (handleAnchorClick) {
    document.removeEventListener('click', handleAnchorClick)
  }
})

watch(() => route.hash, async () => {
  await scrollToHash()
})
</script>

<template>
  <div>
    <component
      :is="SECTION_COMPONENTS[id]"
      v-for="id in resolvedSections"
      :key="id"
    />
  </div>
</template>

<style scoped>
@keyframes heic-spin {
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  100% {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}
</style>
