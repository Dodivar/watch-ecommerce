<template>
  <section class="lg:py-10 pb-20 lg:pb-10 min-h-screen">
    <div class="max-w-7xl mx-auto px-4">
      <!-- Loading State -->
      <WatchDetailSkeleton v-if="isLoading" />

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-10">
        <div v-if="isUnavailable" class="max-w-2xl mx-auto">
          <div class="text-gray-400 mb-3">
            <svg class="w-24 h-24 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
            <h3 class="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">Montre non disponible</h3>
            <p class="text-base lg:text-lg text-gray-600 mb-6">
            Cette pièce n'est plus en stock ou n'est plus disponible dans notre sélection.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <router-link
              :to="browsePath"
              class="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition-colors inline-flex items-center justify-center"
            >
              <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Voir notre collection
            </router-link>
            <router-link
              to="/"
              class="px-6 py-3 bg-cream-200 text-gray-700 rounded-lg font-semibold hover:bg-cream-200 transition-colors inline-flex items-center justify-center"
            >
              Retour à l'accueil
            </router-link>
          </div>
        </div>
        <div v-else>
          <div class="text-red-500 mb-3">
            <svg class="w-16 h-16 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 class="text-xl text-gray-900 mb-2">Erreur de chargement</h3>
          <p class="text-gray-600 mb-3">{{ error }}</p>
          <button
            @click="loadWatch"
            class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>

      <!-- Watch Content -->
      <template v-else-if="watchItem">

      <div class="grid lg:grid-cols-2 gap-4 mb-8">
        <!-- Images Section -->
        <div class="space-y-4 lg:space-y-4 -mx-4 lg:mx-0">
          <!-- Main Image -->
          <div class="bg-white lg:rounded-md lg:shadow-lg overflow-hidden">
            <div 
              ref="imageContainerRef"
              class="relative h-96 lg:h-[500px] image-zoom-container"
              @mouseenter="handleMouseEnter"
              @mouseleave="handleMouseLeave"
              @mousemove="handleMouseMove"
              @touchstart="handleTouchStart"
              @touchmove="handleTouchMove"
              @touchend="handleTouchEnd"
            >
              <img
                v-if="watchItem && watchItem.images && watchItem.images.length > 0"
                :src="watchItem.images[currentImageIndex]"
                :alt="watchItem.name"
                class="w-full h-full object-cover object-center cursor-zoom-in"
                @click="openLightbox"
              />
              <div v-else class="w-full h-full flex items-center justify-center bg-white text-gray-400">
                Image non disponible
              </div>

              <!-- Zoom Preview Encart -->
              <div
                v-if="isHovering && watchItem && watchItem.images && watchItem.images.length > 0"
                class="zoom-preview hidden lg:block"
                :style="zoomPreviewStyle"
              >
                <div 
                  class="zoom-preview-inner"
                  :style="zoomImageStyle"
                >
                </div>
              </div>

              <!-- Action buttons (top right) -->
              <div class="absolute top-2 right-2 lg:top-4 lg:right-4 flex flex-col gap-1.5 lg:gap-2 z-10">
                <!-- Zoom button -->
                <button
                  @click.stop="openLightbox"
                  class="bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-1.5 lg:p-3 transition-all duration-200"
                  title="Agrandir l'image"
                  aria-label="Agrandir l'image"
                >
                  <svg class="w-4 h-4 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                    />
                  </svg>
                </button>
                <!-- Share button -->
                <button
                  @click.stop="openShareLightbox"
                  class="bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-1.5 lg:p-3 transition-all duration-200"
                  title="Partager"
                  aria-label="Partager cette montre"
                >
                  <svg class="w-4 h-4 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                </button>
              </div>

              <!-- Navigation arrows -->
              <button
                v-if="watchItem && watchItem.images && watchItem.images.length > 1"
                @click="previousImage"
                class="absolute left-2 lg:left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-1.5 lg:p-3 transition-all duration-200"
              >
                <svg class="w-4 h-4 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <button
                v-if="watchItem && watchItem.images && watchItem.images.length > 1"
                @click="nextImage"
                class="absolute right-2 lg:right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-1.5 lg:p-3 transition-all duration-200"
              >
                <svg class="w-4 h-4 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              <!-- Image Counter (Mobile only) -->
              <div
                v-if="watchItem && watchItem.images && watchItem.images.length > 1"
                class="lg:hidden absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm pointer-events-none"
              >
                {{ currentImageIndex + 1 }} / {{ watchItem.images.length }}
              </div>
            </div>
          </div>

          <!-- Thumbnail Gallery (Desktop only) -->
          <div
            v-if="watchItem && watchItem.images && watchItem.images.length > 1"
            class="hidden lg:block relative group/thumbnails"
            @mouseenter="updateThumbnailScrollState"
          >
            <button
              v-if="canScrollThumbnailsPrev"
              type="button"
              class="absolute left-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md bg-black/50 text-white opacity-0 transition-opacity duration-200 hover:bg-black/70 group-hover/thumbnails:opacity-100"
              aria-label="Vignettes précédentes"
              @click="scrollThumbnails(-1)"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div
              ref="thumbnailStripRef"
              class="thumbnail-strip flex gap-2 overflow-x-auto scroll-smooth"
              @scroll="updateThumbnailScrollState"
            >
              <button
                v-for="(image, index) in watchItem.images"
                :key="index"
                type="button"
                :ref="(el) => setThumbnailRef(el, index)"
                @click="currentImageIndex = index"
                :class="[
                  'relative h-20 w-20 shrink-0 bg-white rounded-lg overflow-hidden border-2 transition-all duration-200',
                  currentImageIndex === index
                    ? 'border-primary'
                    : 'border-gray-200 hover:border-gray-300',
                ]"
              >
                <img
                  :src="image"
                  :alt="`${watchItem.name} - Image ${index + 1}`"
                  class="w-full h-full object-cover"
                />
              </button>
            </div>

            <button
              v-if="canScrollThumbnailsNext"
              type="button"
              class="absolute right-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md bg-black/50 text-white opacity-0 transition-opacity duration-200 hover:bg-black/70 group-hover/thumbnails:opacity-100"
              aria-label="Vignettes suivantes"
              @click="scrollThumbnails(1)"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <!-- watchItem Info Section -->
        <div class="space-y-6 px-4 lg:px-0">
          <!-- Header -->
          <div>
            <div class="flex items-start justify-between mb-2">
              <h1 class="text-2xl lg:text-4xl font-bold text-gray-900">
                {{ watchItem.name }}
              </h1>
              <div class="flex items-center space-x-2">
                <span
                  v-if="!watchItem.isAvailable"
                  class="ml-4 px-3 py-1 text-sm font-semibold rounded-full bg-orange-100 text-orange-800 whitespace-nowrap"
                >
                  Hors stock
                </span>
                <span
                  v-if="watchItem.isSold"
                  class="ml-4 px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800 whitespace-nowrap"
                >
                  Vendue
                </span>
              </div>
            </div>
            <p v-if="catalogDisplay.showReference && hasValue(watchItem.reference)" class="text-base lg:text-lg text-gray-600 mb-3">Réf. {{ watchItem.reference }}</p>
            <div class="text-2xl lg:text-3xl font-medium text-primary mb-4">
              {{ formatPrice(watchItem.price) }}
            </div>
          </div>

          <!-- Key Features (resale) -->
          <div v-if="isResaleCatalog">
            <h3 class="text-lg lg:text-xl font-semibold text-gray-900 mb-3">Caractéristiques principales</h3>
            <div class="space-y-3">
              <div v-if="hasValue(watchItem.year)" class="flex gap-4 py-2 border-b border-gray-100">
                <span class="text-gray-600 w-[140px] flex-shrink-0 whitespace-normal">Année</span>
                <span class="font-medium text-left flex-1">{{ watchItem.year }}</span>
              </div>
              <div v-if="hasValue(watchItem.condition)" class="flex gap-4 py-2 border-b border-gray-100">
                <span class="text-gray-600 w-[140px] flex-shrink-0 whitespace-normal">État</span>
                <span class="font-medium text-left flex-1">{{ watchItem.condition }}</span>
              </div>
              <div v-if="hasValue(watchItem.details?.content)" class="flex gap-4 py-2 border-b border-gray-100">
                <span class="text-gray-600 w-[140px] flex-shrink-0 whitespace-normal">Contenu</span>
                <span class="font-medium text-left flex-1">{{ watchItem.details.content }}</span>
              </div>
              <div v-if="hasValue(watchItem.details?.guarantee)" class="flex gap-4 py-2 border-b border-gray-100">
                <span class="text-gray-600 w-[140px] flex-shrink-0 whitespace-normal">Garantie</span>
                <span class="font-medium text-left flex-1">{{ watchItem.details.guarantee }}</span>
              </div>
            </div>
          </div>

          <!-- Buy Now Button -->
            <div v-if="PURCHASE_ENABLED && watchItem && watchItem.isAvailable && !watchItem.isSold" class="hidden lg:block">
              <button
                @click="handleAddToCart"
                class="w-full inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-semibold rounded-lg text-white bg-primary hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg mb-3"
              >
                <svg
                  class="w-6 h-6 mr-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                Ajouter au panier
              </button>
              
              <!-- Payment Icons (resale only) -->
              <PaymentIcons v-if="isResaleCatalog" />
            </div>

          <!-- Retail appointment (always visible on retail catalog) -->
          <div v-if="!isResaleCatalog && watchItem" class="mt-3">
            <button
              type="button"
              @click="openAppointmentModal"
              class="w-full inline-flex items-center justify-center px-6 py-3 border border-primary/30 text-base font-medium rounded-lg text-primary bg-white hover:bg-primary/5 transition-colors duration-200"
            >
              <svg
                class="w-5 h-5 mr-2 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Prendre rendez-vous
            </button>
          </div>

          <!-- Trust highlights (retail) — carte compacte sous le bouton d'achat -->
          <div
            v-if="!isResaleCatalog && retailTrustHighlights.length > 0"
            class="bg-white rounded-md shadow-lg border border-gray-100 p-3 lg:p-4"
            :class="PURCHASE_ENABLED && watchItem && watchItem.isAvailable && !watchItem.isSold ? 'mt-3 lg:mt-4' : ''"
          >
            <ul class="flex flex-col gap-2">
              <li
                v-for="highlight in retailTrustHighlights"
                :key="highlight.id"
                class="flex items-center gap-2 min-w-0"
              >
                <div
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary [&_svg]:h-6 [&_svg]:w-6"
                  :aria-label="highlight.label || undefined"
                >
                  <TrustHighlightIcon :name="highlight.icon" />
                </div>
                <p class="text-sm text-gray-700 leading-snug min-w-0">
                  {{ highlight.text }}
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- En savoir plus sur l'annonce - Tabs Section -->
      <div class="bg-white rounded-md shadow-lg p-8 mb-8">
        <h2 class="text-xl lg:text-2xl font-semibold text-gray-900 mb-6">En savoir plus sur l'annonce</h2>
        
        <!-- Tabs -->
        <div class="border-b border-gray-200 mb-6">
          <nav class="flex space-x-4 lg:space-x-8 overflow-x-auto" aria-label="Tabs">
            <button
              @click="activeTab = 'details'"
              :class="[
                'py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap',
                activeTab === 'details'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              Détails
            </button>
            <button
              @click="activeTab = 'security'"
              :class="[
                'py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap',
                activeTab === 'security'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              Garanties
            </button>
          </nav>
        </div>

        <!-- Tab Content: Details -->
        <div v-if="activeTab === 'details'" class="grid lg:grid-cols-2 gap-8">
          <!-- Left Column: Données de base -->
          <div>
            <h3 class="text-base lg:text-lg font-semibold text-gray-900 mb-4">Données de base</h3>
            <div class="space-y-0">
              <div v-if="catalogDisplay.showAdCode && hasValue(watchItem.adCode)" class="flex gap-4 py-3 border-b border-gray-200">
                <span class="text-gray-600 min-w-[160px] flex-shrink-0">Code annonce</span>
                <span class="font-medium text-gray-900 flex-1">{{ watchItem.adCode }}</span>
              </div>
              <div v-if="hasValue(watchItem.brand)" class="flex gap-4 py-3 border-b border-gray-200">
                <span class="text-gray-600 min-w-[160px] flex-shrink-0">Marque</span>
                <span class="font-medium text-gray-900 flex-1">{{ watchItem.brand }}</span>
              </div>
              <div v-if="hasValue(watchItem.model)" class="flex gap-4 py-3 border-b border-gray-200">
                <span class="text-gray-600 min-w-[160px] flex-shrink-0">Modèle</span>
                <span class="font-medium text-gray-900 flex-1">{{ watchItem.model }}</span>
              </div>
              <div v-if="catalogDisplay.showReference && hasValue(watchItem.reference)" class="flex gap-4 py-3 border-b border-gray-200">
                <span class="text-gray-600 min-w-[160px] flex-shrink-0">Numéro de référence</span>
                <span class="font-medium text-gray-900 flex-1">{{ watchItem.reference }}</span>
              </div>
              <div v-if="hasValue(watchItem.details?.movement)" class="flex gap-4 py-3 border-b border-gray-200">
                <span class="text-gray-600 min-w-[160px] flex-shrink-0">Mouvement</span>
                <span class="font-medium text-gray-900 flex-1">{{ watchItem.details.movement }}</span>
              </div>
              <div v-if="hasValue(watchItem.details?.caseMaterial)" class="flex gap-4 py-3 border-b border-gray-200">
                <span class="text-gray-600 min-w-[160px] flex-shrink-0">Boîtier</span>
                <span class="font-medium text-gray-900 flex-1">{{ watchItem.details.caseMaterial }}</span>
              </div>
              <div v-if="hasValue(watchItem.details?.braceletMaterial)" class="flex gap-4 py-3 border-b border-gray-200">
                <span class="text-gray-600 min-w-[160px] flex-shrink-0">Matière du bracelet</span>
                <span class="font-medium text-gray-900 flex-1">{{ watchItem.details.braceletMaterial }}</span>
              </div>
              <div v-if="catalogDisplay.showYearInDetails && hasValue(watchItem.year)" class="flex gap-4 py-3 border-b border-gray-200">
                <span class="text-gray-600 min-w-[160px] flex-shrink-0">Année de fabrication</span>
                <span class="font-medium text-gray-900 flex-1">{{ watchItem.year }}</span>
              </div>
              <div v-if="catalogDisplay.showConditionInDetails && hasValue(watchItem.condition)" class="flex gap-4 py-3 border-b border-gray-200">
                <span class="text-gray-600 min-w-[160px] flex-shrink-0">État</span>
                <div class="font-medium text-gray-900 flex-1">
                  <div>{{ watchItem.condition }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Spécifications techniques -->
          <div>
            <h3 class="text-base lg:text-lg font-semibold text-gray-900 mb-4">Spécifications techniques</h3>
            <div class="space-y-3">
              <div v-if="hasValue(watchItem.details?.caseSize)" class="flex gap-4 py-2 border-b border-gray-200">
                <span class="text-gray-600 min-w-[140px] flex-shrink-0">Diamètre du boîtier</span>
                <span class="font-medium text-gray-900 flex-1">{{ formatCaseSizeDisplay(watchItem.details.caseSize) }}</span>
              </div>
              <div v-if="hasValue(watchItem.details?.thickness)" class="flex gap-4 py-2 border-b border-gray-200">
                <span class="text-gray-600 min-w-[140px] flex-shrink-0">Épaisseur</span>
                <span class="font-medium text-gray-900 flex-1">{{ watchItem.details.thickness }}</span>
              </div>
              <div v-if="hasValue(watchItem.details?.dialColor)" class="flex gap-4 py-2 border-b border-gray-200">
                <span class="text-gray-600 min-w-[140px] flex-shrink-0">Couleur du cadran</span>
                <span class="font-medium text-gray-900 flex-1">{{ watchItem.details.dialColor }}</span>
              </div>
              <div v-if="hasValue(watchItem.details?.crystal)" class="flex gap-4 py-2 border-b border-gray-200">
                <span class="text-gray-600 min-w-[140px] flex-shrink-0">Matière de la glace</span>
                <span class="font-medium text-gray-900 flex-1">{{ watchItem.details.crystal }}</span>
              </div>
              <div v-if="hasValue(watchItem.details?.waterResistance)" class="flex gap-4 py-2 border-b border-gray-200">
                <span class="text-gray-600 min-w-[140px] flex-shrink-0">Étanchéité</span>
                <span class="font-medium text-gray-900 flex-1">{{ watchItem.details.waterResistance }}</span>
              </div>
              <div v-if="hasValue(watchItem.details?.functions)" class="flex gap-4 py-2 border-b border-gray-200">
                <span class="text-gray-600 min-w-[140px] flex-shrink-0">Fonctions</span>
                <span class="font-medium text-gray-900 flex-1">{{ watchItem.details.functions }}</span>
              </div>
              <div v-if="hasValue(watchItem.details?.powerReserve)" class="flex gap-4 py-2 border-b border-gray-200">
                <span class="text-gray-600 min-w-[140px] flex-shrink-0">Réserve de marche</span>
                <span class="font-medium text-gray-900 flex-1">{{ watchItem.details.powerReserve }}</span>
              </div>
              <div v-if="hasValue(watchItem.details?.frequency)" class="flex gap-4 py-2 border-b border-gray-200">
                <span class="text-gray-600 min-w-[140px] flex-shrink-0">Fréquence</span>
                <span class="font-medium text-gray-900 flex-1">{{ watchItem.details.frequency }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab Content: Security -->
        <div v-if="activeTab === 'security'">
          <h3 class="text-lg lg:text-xl font-semibold text-gray-900 mb-6">Les garanties pour cette annonce</h3>
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Card 1: Droit de rétractation -->
            <div class="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div class="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <svg class="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h4 class="text-base lg:text-lg font-semibold text-gray-900 mb-2">Droit de rétractation de 14 jours</h4>
              <p class="text-gray-600 text-sm leading-relaxed">
                Si la montre présente des défauts ou ne correspond pas à vos attentes, vous pouvez exercer votre droit de rétractation dans un délai de 14 jours à compter de la réception pour obtenir un remboursement intégral du prix d'achat, rapidement et simplement.
              </p>
            </div>

            <!-- Card 2: Authentification garantie -->
            <div class="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div class="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <!-- Icône oeil pour authentification garantie -->
                <svg class="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M1.458 12C2.732 7.943 6.522 5 12 5s9.268 2.943 10.542 7c-1.274 4.057-5.064 7-10.542 7s-9.268-2.943-10.542-7z" />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none" />
                </svg>
              </div>
              <h4 class="text-base lg:text-lg font-semibold text-gray-900 mb-2">Authentification garantie</h4>
              <p class="text-gray-600 text-sm leading-relaxed">
                {{ siteCopy.watchSecurityAuthentic }}
              </p>
            </div>

            <!-- Card 3: Garantie mécanisme -->
            <div class="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div class="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <svg class="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 class="text-base lg:text-lg font-semibold text-gray-900 mb-2">Garantie 1 an sur le mécanisme</h4>
              <p class="text-gray-600 text-sm leading-relaxed">
                Toutes nos montres bénéficient d'une garantie d'un an sur le mécanisme. En cas de problème mécanique, nous prenons en charge la réparation ou le remplacement, vous permettant d'acheter en toute sérénité.
              </p>
            </div>

            <!-- Card 4: Assurance transport -->
            <div class="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div class="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <svg class="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 class="text-base lg:text-lg font-semibold text-gray-900 mb-2">Envoi assuré</h4>
              <p class="text-gray-600 text-sm leading-relaxed">
                {{ siteCopy.watchSecurityInsurance }}
              </p>
            </div>

            <!-- Card 5: Paiement sécurisé -->
            <div class="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div class="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <svg class="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 class="text-base lg:text-lg font-semibold text-gray-900 mb-2">Paiement sécurisé</h4>
              <p class="text-gray-600 text-sm leading-relaxed">
                Tous les paiements sont traités de manière sécurisée via Stripe, garantissant la protection de vos données bancaires. Aucune information de paiement n'est stockée sur nos serveurs.
              </p>
            </div>

            <!-- Card 6: Colis sécurisé et assuré -->
            <div class="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div class="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <svg class="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <!-- Icône colis style isométrique (similaire à heroicons "cube") -->
                  <polygon points="21 7.5 12 3 3 7.5 12 12 21 7.5" fill="none" stroke="currentColor"/>
                  <polygon points="3 7.5 3 16.5 12 21 12 12 3 7.5" fill="none" stroke="currentColor"/>
                  <polygon points="21 7.5 21 16.5 12 21 12 12 21 7.5" fill="none" stroke="currentColor"/>
                </svg>
              </div>
              <h4 class="text-base lg:text-lg font-semibold text-gray-900 mb-2">Colis sécurisé et assuré</h4>
              <p class="text-gray-600 text-sm leading-relaxed">
                L'envoi de votre montre est sécurisé et assuré à la valeur déclarée de la montre. Chaque colis est suivi et protégé de bout en bout, garantissant une livraison en toute sécurité jusqu'à votre domicile.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Accessories (resale only) -->
      <div v-if="catalogDisplay.showDeliveryContent" class="grid lg:grid-cols-2 gap-8 mb-12">
        <div class="bg-white rounded-md shadow-lg p-6">
          <h3 class="text-lg lg:text-xl font-semibold text-gray-900 mb-4">Contenu de la livraison</h3>
          <div class="space-y-3">
            <div
              v-for="(item, index) in watchItem.details.accessories"
              :key="index"
              class="flex items-center space-x-3"
            >
              <svg
                :class="['w-5 h-5', item.included ? 'text-primary' : 'text-gray-400']"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  :d="item.included ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'"
                />
              </svg>
              <span :class="item.included ? 'text-gray-900' : 'text-gray-500'">
                {{ item.name }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Related Articles Section -->
      <div v-if="watchItem && watchItem.articles && watchItem.articles.length > 0" class="bg-white rounded-md shadow-lg p-8 mb-12">
        <h2 class="text-xl lg:text-2xl font-semibold text-gray-900 mb-6">Articles liés</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <article
            v-for="article in watchItem.articles"
            :key="article.id"
            class="bg-white rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer shadow-sm"
            @click="goToArticle(article.id)"
          >
            <h3 class="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
              {{ article.title }}
            </h3>
            <p class="text-gray-600 text-sm mb-4 line-clamp-3">
              {{ getArticleExcerpt(article.text) }}
            </p>
            <div v-if="article.categories && article.categories.length > 0" class="mb-4 flex flex-wrap gap-2">
              <span
                v-for="cat in article.categories"
                :key="cat"
                class="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary"
              >
                {{ cat }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">
                {{ formatArticleDate(article.created_at) }}
              </span>
              <span class="text-primary text-sm font-medium hover:underline">
                Lire l'article →
              </span>
            </div>
          </article>
        </div>
      </div>
      
      <!-- Description Section (Expandable) -->
      <div class="bg-white rounded-md shadow-lg mb-8 overflow-hidden">
        <button
          @click="isDescriptionExpanded = !isDescriptionExpanded"
          class="w-full flex items-center justify-between p-8 text-left hover:bg-gray-50 transition-colors"
          :aria-expanded="isDescriptionExpanded"
        >
          <h2 class="text-lg lg:text-xl font-semibold text-gray-900">Description</h2>
          <svg
            :class="[
              'w-6 h-6 text-gray-500 transition-transform duration-200',
              isDescriptionExpanded ? 'transform rotate-180' : ''
            ]"
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
        </button>
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-300 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-2"
        >
          <div
            v-show="isDescriptionExpanded"
            class="px-8 pb-8"
          >
            <div class="prose max-w-none text-gray-700 leading-relaxed">
              <div v-if="hasValue(watchItem.description)">
                <p class="mb-4 whitespace-pre-line">{{ watchItem.description }}</p>
              </div>
              <div v-else class="text-gray-500 italic">
                Aucune description disponible.
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Contact Reminder Section -->
      <div class="bg-white rounded-md shadow-lg p-8">
        <div class="text-center mb-6">
          <h2 class="text-xl lg:text-3xl font-bold mb-3 text-gray-900">Une question sur cette montre ?</h2>
          <p class="text-base lg:text-lg text-gray-600">
            Contactez-nous par WhatsApp ou email pour plus d'informations
          </p>
        </div>
        <div class="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
          <a
            :href="
              watchItem
                ? 'https://wa.me/' +
                  WHATSAPP_NUMBER +
                  '?text=' +
                  encodeURIComponent(
                    `Bonjour, je suis intéressé par la montre ${watchItem.name}${catalogDisplay.showReference && watchItem.reference ? ` (Réf. ${watchItem.reference})` : ''} au prix de ${formatPrice(watchItem.price)}`,
                  )
                : '#'
            "
            target="_blank"
            class="flex-1 inline-flex items-center justify-center px-6 py-4 border border-transparent text-base font-medium rounded-lg text-white bg-primary hover:bg-primary-hover transition-colors duration-200"
          >
            <svg class="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"
              />
            </svg>
            WhatsApp
          </a>
          <a
            :href="
              watchItem
                ? 'mailto:' +
                  EMAIL_CONTACT +
                  '?subject=' +
                  encodeURIComponent(`Demande d'information - ${watchItem.name}`) +
                  '&body=' +
                  encodeURIComponent(
                    `Bonjour,\n\nJe souhaiterais avoir plus d'informations concernant la montre ${watchItem.name}${catalogDisplay.showReference && watchItem.reference ? ` (Réf. ${watchItem.reference})` : ''} proposée au prix de ${formatPrice(watchItem.price)}.\n\nCordialement`,
                  )
                : '#'
            "
            class="flex-1 inline-flex items-center justify-center px-6 py-4 border border-transparent text-base font-medium rounded-lg text-white bg-primary hover:bg-primary-hover transition-colors duration-200"
          >
            <svg class="w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Email
          </a>
        </div>
      </div>
      </template>
    </div>
  </section>

  <!-- Sticky Buy Button Mobile -->
  <div
    v-if="PURCHASE_ENABLED && watchItem && watchItem.isAvailable && !watchItem.isSold"
    class="fixed bottom-0 left-0 right-0 lg:hidden z-20 bg-white shadow-lg border-t border-gray-200 px-4 py-3"
  >
    <div class="flex items-center justify-between gap-4 max-w-7xl mx-auto">
      <!-- Watch Info and Price -->
      <div class="flex-1 min-w-0">
        <div class="text-sm font-semibold text-gray-900 truncate mb-0.5">
          {{ watchItem.name }}
        </div>
        <div class="text-xl lg:text-2xl font-medium text-primary">
          {{ formatPrice(watchItem.price) }}
        </div>
      </div>
      <!-- Buy Button -->
      <button
        @click="handleAddToCart"
        class="flex-shrink-0 inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-semibold rounded-lg text-white bg-primary hover:bg-primary-hover transition-colors duration-200 shadow-md"
      >
        <svg
          class="w-5 h-5 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
        Ajouter au panier
      </button>
    </div>
  </div>

    <!-- Lightbox Modal -->
    <Teleport to="body">
      <div
        v-if="isLightboxOpen"
        class="lightbox-overlay fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-90 p-4"
        @click="closeLightbox"
        @keydown.esc="closeLightbox"
        @touchstart="handleLightboxTouchStart"
        @touchmove="handleLightboxTouchMove"
        @touchend="handleLightboxTouchEnd"
        tabindex="-1"
      >
        <!-- Close button -->
        <button
          @click.stop="closeLightbox"
          class="absolute top-4 right-4 z-10 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-3 transition-all duration-200"
          title="Fermer"
          aria-label="Fermer la lightbox"
        >
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <!-- Main image in lightbox -->
        <img
          v-if="watchItem"
          :src="watchItem.images[currentImageIndex]"
          :alt="watchItem.name"
          class="max-w-[90vw] max-h-[90vh] object-contain"
          @click.stop
        />

        <!-- Navigation arrows in lightbox -->
        <button
          v-if="watchItem && watchItem.images && watchItem.images.length > 1"
          @click.stop="previousImage"
          class="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-4 transition-all duration-200 z-10"
          aria-label="Image précédente"
        >
          <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <button
          v-if="watchItem && watchItem.images && watchItem.images.length > 1"
          @click.stop="nextImage"
          class="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-4 transition-all duration-200 z-10"
          aria-label="Image suivante"
        >
          <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        <!-- Image counter -->
        <div
          v-if="watchItem && watchItem.images.length > 1"
          class="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm pointer-events-none"
        >
          {{ currentImageIndex + 1 }} / {{ watchItem.images.length }}
        </div>
      </div>
    </Teleport>

    <!-- Share Lightbox Modal -->
    <Teleport to="body">
      <div
        v-if="isShareLightboxOpen"
        class="lightbox-overlay fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-90 p-4"
        @click="closeShareLightbox"
        @keydown.esc="closeShareLightbox"
        tabindex="-1"
      >
        <!-- Share Modal Content -->
        <div
          @click.stop
          class="relative bg-white rounded-md shadow-2xl p-8 max-w-md w-full mx-4"
        >
          <!-- Close button -->
          <button
            @click="closeShareLightbox"
            class="absolute top-4 right-4 bg-cream-100 hover:bg-cream-200 text-gray-600 rounded-full p-2 transition-all duration-200"
            title="Fermer"
            aria-label="Fermer"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <!-- Title -->
          <h2 class="text-xl lg:text-2xl font-bold text-gray-900 mb-6 text-center">Partager cette montre</h2>

          <!-- Share buttons -->
          <div class="flex flex-col gap-4">
            <!-- Facebook -->
            <button
              @click="shareOnFacebook"
              class="flex items-center justify-center gap-3 px-6 py-4 rounded-lg bg-[#1877F2] text-white hover:bg-[#166FE5] transition-colors font-medium"
            >
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>Partager sur Facebook</span>
            </button>

            <!-- X (Twitter) -->
            <button
              @click="shareOnTwitter"
              class="flex items-center justify-center gap-3 px-6 py-4 rounded-lg bg-black text-white hover:bg-gray-800 transition-colors font-medium"
            >
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span>Partager sur X</span>
            </button>

            <!-- Email -->
            <button
              @click="shareByEmail"
              class="flex items-center justify-center gap-3 px-6 py-4 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-colors font-medium"
            >
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Partager par email</span>
            </button>

            <!-- Copy URL -->
            <button
              @click="copyUrl"
              class="flex items-center justify-center gap-3 px-6 py-4 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors font-medium relative"
            >
              <svg v-if="!urlCopied" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <svg v-else class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>{{ urlCopied ? 'URL copiée !' : 'Copier l\'URL' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <WatchAppointmentModal
      v-if="watchItem && !isResaleCatalog"
      :open="appointmentModalOpen"
      :watch-context="watchAppointmentContext"
      @close="appointmentModalOpen = false"
    />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHead } from '@vueuse/head'
import { scrollAnimation } from '@/animation'
import { WHATSAPP_NUMBER, EMAIL_CONTACT, BASE_URL, PURCHASE_ENABLED } from '@/config'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { getBrowsePath } from '@/site/siteFeatures.js'
import { resolveRetailTrustHighlights } from '@/site/watchCatalogDisplay.js'
import { getWatchById } from '@/services/watchService'
import { formatCaseSizeDisplay } from '@/utils/caseSize'

const site = getSiteConfig()
const siteCopy = site.copy
const seoWatch = site.seo.watchDetail
const browsePath = getBrowsePath(site.features)
const catalogDisplay = site.watchCatalog.display
const isResaleCatalog = site.watchCatalog.isResale
import { isAdminAuthenticated } from '@/services/admin/adminAuthService'
import { useCart } from '@/composables/useCart.js'
import WatchDetailSkeleton from '@/components/watch/WatchDetailSkeleton.vue'
import WatchAppointmentModal from '@/components/watch/WatchAppointmentModal.vue'
import PaymentIcons from '@/components/payment/PaymentIcons.vue'
import TrustHighlightIcon from '@/components/watch/TrustHighlightIcon.vue'

const route = useRoute()
const router = useRouter()

// Current image index for slider
const currentImageIndex = ref(0)

// Thumbnail strip navigation
const thumbnailStripRef = ref(null)
const thumbnailRefs = ref([])
const canScrollThumbnailsPrev = ref(false)
const canScrollThumbnailsNext = ref(false)

function setThumbnailRef(el, index) {
  if (el) {
    thumbnailRefs.value[index] = el
  }
}

function updateThumbnailScrollState() {
  const el = thumbnailStripRef.value
  if (!el) return
  canScrollThumbnailsPrev.value = el.scrollLeft > 1
  canScrollThumbnailsNext.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
}

function scrollThumbnails(direction) {
  const el = thumbnailStripRef.value
  if (!el) return
  const firstThumb = el.querySelector('button')
  const step = firstThumb ? firstThumb.offsetWidth + 8 : 88
  el.scrollBy({ left: direction * step, behavior: 'smooth' })
}

function scrollActiveThumbnailIntoView() {
  nextTick(() => {
    const active = thumbnailRefs.value[currentImageIndex.value]
    active?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
    updateThumbnailScrollState()
  })
}

// Lightbox state
const isLightboxOpen = ref(false)

// Share lightbox state
const isShareLightboxOpen = ref(false)
const urlCopied = ref(false)

// Retail appointment modal
const appointmentModalOpen = ref(false)

const watchAppointmentContext = computed(() => {
  if (!watchItem.value) return null
  return {
    id: watchItem.value.id,
    name: watchItem.value.name,
    price: watchItem.value.price,
    url: `${BASE_URL}${route.fullPath}`,
  }
})

function openAppointmentModal() {
  appointmentModalOpen.value = true
}

// Zoom on hover state
const isHovering = ref(false)
const mousePosition = ref({ x: 0, y: 0 })
const imageContainerRef = ref(null)
const imageNaturalSize = ref({ width: 0, height: 0 })
const zoomLevel = 1 // Niveau de zoom (3x pour garantir que l'image couvre toujours l'encart)

// Swipe state for mobile/tablet
const touchStartX = ref(0)
const touchStartY = ref(0)
const touchEndX = ref(0)
const touchEndY = ref(0)
const hasMoved = ref(false) // Track if user has moved finger during touch
const minSwipeDistance = 50 // Distance minimale en pixels pour déclencher un swipe

// State
const watchItem = ref(null)
const retailTrustHighlights = computed(() =>
  resolveRetailTrustHighlights(site, watchItem.value),
)
const { add: addToCart, openDrawer: openCartDrawer } = useCart()
const isLoading = ref(true)
const error = ref(null)
const isUnavailable = ref(false)
const isAdmin = ref(false)
const activeTab = ref('details')
const isDescriptionExpanded = ref(false)


// Load watch from Supabase
const loadWatch = async () => {
  try {
    isLoading.value = true
    error.value = null
    isUnavailable.value = false
    
    // Vérifier si l'utilisateur est admin
    isAdmin.value = await isAdminAuthenticated()
    
    const watchId = route.params.id
    if (!watchId) {
      throw new Error('ID de montre manquant')
    }
    
    // Si l'utilisateur est admin, permettre de voir les montres hors-stock
    const data = await getWatchById(watchId, isAdmin.value)
    watchItem.value = data
    // Reset image index when watch changes
    currentImageIndex.value = 0
    // Load image dimensions
    if (data && data.images && data.images.length > 0) {
      await loadImageDimensions(data.images[0])
    }
  } catch (err) {
    console.error('Erreur lors du chargement de la montre:', err)
    // Vérifier si c'est une erreur de disponibilité
    if (err.message === 'UNAVAILABLE') {
      isUnavailable.value = true
      error.value = 'Cette montre n\'est plus disponible'
    } else {
      error.value = err.message || 'Une erreur est survenue lors du chargement de la montre'
    }
  } finally {
    isLoading.value = false
  }
}

// Image navigation methods
const nextImage = () => {
  if (watchItem.value && watchItem.value.images.length > 1) {
    currentImageIndex.value = (currentImageIndex.value + 1) % watchItem.value.images.length
  }
}

const previousImage = () => {
  if (watchItem.value && watchItem.value.images.length > 1) {
    currentImageIndex.value =
      currentImageIndex.value === 0 ? watchItem.value.images.length - 1 : currentImageIndex.value - 1
  }
}

// Load image natural dimensions
const loadImageDimensions = (imageSrc) => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      imageNaturalSize.value = {
        width: img.naturalWidth,
        height: img.naturalHeight
      }
      resolve()
    }
    img.onerror = () => {
      // En cas d'erreur, utiliser les dimensions du conteneur comme fallback
      if (imageContainerRef.value) {
        const rect = imageContainerRef.value.getBoundingClientRect()
        imageNaturalSize.value = {
          width: rect.width,
          height: rect.height
        }
      }
      resolve()
    }
    img.src = imageSrc
  })
}

// Zoom on hover methods
const handleMouseEnter = () => {
  // Only enable on desktop (not touch devices)
  if (window.innerWidth >= 1024 && !('ontouchstart' in window)) {
    isHovering.value = true
  }
}

const handleMouseLeave = () => {
  isHovering.value = false
}

const handleMouseMove = (event) => {
  if (!imageContainerRef.value || !isHovering.value) return
  
  const rect = imageContainerRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  mousePosition.value = {
    x: Math.max(0, Math.min(x, rect.width)),
    y: Math.max(0, Math.min(y, rect.height))
  }
}

// Swipe handlers for mobile/tablet
const handleTouchStart = (event) => {
  if (!watchItem.value || !watchItem.value.images || watchItem.value.images.length <= 1) return
  
  const touch = event.touches[0]
  touchStartX.value = touch.clientX
  touchStartY.value = touch.clientY
  touchEndX.value = touch.clientX
  touchEndY.value = touch.clientY
  hasMoved.value = false // Reset movement flag
}

const handleTouchMove = (event) => {
  if (event.touches.length === 1) {
    const touch = event.touches[0]
    touchEndX.value = touch.clientX
    touchEndY.value = touch.clientY
    hasMoved.value = true // Mark that user has moved finger
    
    // Si le mouvement est principalement horizontal, empêcher le scroll
    const deltaX = Math.abs(touch.clientX - touchStartX.value)
    const deltaY = Math.abs(touch.clientY - touchStartY.value)
    
    if (deltaX > deltaY && deltaX > 10) {
      event.preventDefault()
    }
  }
}

const handleTouchEnd = () => {
  if (!watchItem.value || !watchItem.value.images || watchItem.value.images.length <= 1) return
  
  // Only change image if user actually moved finger (not just a tap)
  if (!hasMoved.value) {
    // Reset touch positions and return early - this was just a tap/click
    touchStartX.value = 0
    touchStartY.value = 0
    touchEndX.value = 0
    touchEndY.value = 0
    hasMoved.value = false
    return
  }
  
  const deltaX = touchEndX.value - touchStartX.value
  const deltaY = touchEndY.value - touchStartY.value
  
  // Vérifier que le swipe est principalement horizontal (plus horizontal que vertical)
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
    if (deltaX > 0) {
      // Swipe vers la droite = image précédente
      previousImage()
    } else {
      // Swipe vers la gauche = image suivante
      nextImage()
    }
  }
  
  // Reset touch positions
  touchStartX.value = 0
  touchStartY.value = 0
  touchEndX.value = 0
  touchEndY.value = 0
  hasMoved.value = false
}

// Swipe handlers for lightbox
const handleLightboxTouchStart = (event) => {
  if (!watchItem.value || !watchItem.value.images || watchItem.value.images.length <= 1) return
  
  const touch = event.touches[0]
  touchStartX.value = touch.clientX
  touchStartY.value = touch.clientY
  touchEndX.value = touch.clientX
  touchEndY.value = touch.clientY
  hasMoved.value = false // Reset movement flag
}

const handleLightboxTouchMove = (event) => {
  if (event.touches.length === 1) {
    const touch = event.touches[0]
    touchEndX.value = touch.clientX
    touchEndY.value = touch.clientY
    hasMoved.value = true // Mark that user has moved finger
    
    // Si le mouvement est principalement horizontal, empêcher le scroll
    const deltaX = Math.abs(touch.clientX - touchStartX.value)
    const deltaY = Math.abs(touch.clientY - touchStartY.value)
    
    if (deltaX > deltaY && deltaX > 10) {
      event.preventDefault()
    }
  }
}

const handleLightboxTouchEnd = () => {
  if (!watchItem.value || !watchItem.value.images || watchItem.value.images.length <= 1) return
  
  // Only change image if user actually moved finger (not just a tap)
  if (!hasMoved.value) {
    // Reset touch positions and return early - this was just a tap/click
    touchStartX.value = 0
    touchStartY.value = 0
    touchEndX.value = 0
    touchEndY.value = 0
    hasMoved.value = false
    return
  }
  
  const deltaX = touchEndX.value - touchStartX.value
  const deltaY = touchEndY.value - touchStartY.value
  
  // Vérifier que le swipe est principalement horizontal (plus horizontal que vertical)
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
    if (deltaX > 0) {
      // Swipe vers la droite = image précédente
      previousImage()
    } else {
      // Swipe vers la gauche = image suivante
      nextImage()
    }
  }
  
  // Reset touch positions
  touchStartX.value = 0
  touchStartY.value = 0
  touchEndX.value = 0
  touchEndY.value = 0
  hasMoved.value = false
}

// Computed styles for zoom preview
const zoomPreviewStyle = computed(() => {
  if (!imageContainerRef.value) return {}
  
  const rect = imageContainerRef.value.getBoundingClientRect()
  const previewSize = 400 // Taille de l'encart de zoom
  const offset = 20 // Distance depuis l'image
  const isDesktop = window.innerWidth >= 1024
  
  let left, top
  
  // En desktop, utiliser l'offset normal
  // En responsive, utiliser un offset minimal pour coller l'encart à l'image
  const actualOffset = isDesktop ? offset : 5
  
  // Toujours essayer de positionner à droite de l'image d'abord
  left = rect.right + actualOffset
  
  // Si pas assez de place à droite, mettre à gauche
  if (left + previewSize > window.innerWidth) {
    left = rect.left - previewSize - actualOffset
    
    // En responsive, si même à gauche ça dépasse, coller directement au bord de l'image
    if (!isDesktop && left < 0) {
      // Coller à droite sans offset
      left = rect.right
      // Si ça dépasse encore, mettre à gauche sans offset
      if (left + previewSize > window.innerWidth) {
        left = rect.left - previewSize
        // Si même ça dépasse, ajuster pour rester visible mais le plus proche possible
        if (left < 0) {
          left = Math.max(10, window.innerWidth - previewSize - 10)
        }
      }
    }
  }
  
  // Ajuster verticalement pour rester dans la fenêtre
  top = rect.top
  if (top + previewSize > window.innerHeight) {
    top = window.innerHeight - previewSize - 20
  }
  if (top < 20) {
    top = 20
  }
  
  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${previewSize}px`,
    height: `${previewSize}px`
  }
})

// Computed styles for zoomed image
const zoomImageStyle = computed(() => {
  if (!imageContainerRef.value || !watchItem.value || !isHovering.value) return {}
  if (imageNaturalSize.value.width === 0 || imageNaturalSize.value.height === 0) return {}
  
  const rect = imageContainerRef.value.getBoundingClientRect()
  const previewSize = 400 // Taille de l'encart de zoom
  
  // S'assurer que rect a des dimensions valides
  if (rect.width === 0 || rect.height === 0) return {}
  
  // Calculer comment l'image est affichée dans le conteneur (avec object-cover)
  // object-cover remplit le conteneur en préservant le ratio, donc l'image peut être rognée
  const containerAspect = rect.width / rect.height
  const imageAspect = imageNaturalSize.value.width / imageNaturalSize.value.height
  
  // Calculer quelle partie de l'image naturelle est visible dans le conteneur
  let visibleImageWidth, visibleImageHeight, cropOffsetX, cropOffsetY
  
  if (imageAspect > containerAspect) {
    // L'image est plus large que le conteneur, elle est rognée sur les côtés
    // L'image remplit la hauteur du conteneur
    visibleImageHeight = imageNaturalSize.value.height
    visibleImageWidth = visibleImageHeight * containerAspect
    // L'image est centrée horizontalement, donc on rogne les côtés
    cropOffsetX = (imageNaturalSize.value.width - visibleImageWidth) / 2
    cropOffsetY = 0
  } else {
    // L'image est plus haute que le conteneur, elle est rognée en haut/bas
    // L'image remplit la largeur du conteneur
    visibleImageWidth = imageNaturalSize.value.width
    visibleImageHeight = visibleImageWidth / containerAspect
    // L'image est centrée verticalement, donc on rogne en haut et en bas
    cropOffsetX = 0
    cropOffsetY = (imageNaturalSize.value.height - visibleImageHeight) / 2
  }
  
  // La position de la souris dans le conteneur (0 à rect.width/height)
  // On doit la mapper à la position dans l'image naturelle complète
  // Le conteneur montre la partie visible de l'image (visibleImageWidth x visibleImageHeight)
  // qui commence à (cropOffsetX, cropOffsetY) dans l'image naturelle
  
  // Convertir la position de la souris en ratio dans la partie visible (0-1)
  const visibleXRatio = mousePosition.value.x / rect.width
  const visibleYRatio = mousePosition.value.y / rect.height
  
  // Convertir ce ratio en position dans l'image naturelle complète
  const xRatio = (cropOffsetX + visibleXRatio * visibleImageWidth) / imageNaturalSize.value.width
  const yRatio = (cropOffsetY + visibleYRatio * visibleImageHeight) / imageNaturalSize.value.height
  
  // Clamp pour rester dans les limites (ne devrait pas être nécessaire mais sécurité)
  const finalXRatio = Math.max(0, Math.min(1, xRatio))
  const finalYRatio = Math.max(0, Math.min(1, yRatio))
  
  // Calculer les dimensions de l'image zoomée en préservant le ratio d'aspect
  const zoomedWidth = imageNaturalSize.value.width * zoomLevel
  const zoomedHeight = imageNaturalSize.value.height * zoomLevel
  
  // Calculer la position dans l'image zoomée où se trouve le point sous la souris
  const zoomedX = finalXRatio * zoomedWidth
  const zoomedY = finalYRatio * zoomedHeight
  
  // Pour centrer ce point dans l'encart, on doit calculer la position du background
  const backgroundX = (previewSize / 2) - zoomedX
  const backgroundY = (previewSize / 2) - zoomedY
  
  // Limiter la position pour éviter les zones blanches
  const minBackgroundX = Math.min(0, previewSize - zoomedWidth)
  const maxBackgroundX = 0
  const minBackgroundY = Math.min(0, previewSize - zoomedHeight)
  const maxBackgroundY = 0
  
  // Clamp les valeurs entre les limites
  const finalBackgroundX = Math.max(minBackgroundX, Math.min(maxBackgroundX, backgroundX))
  const finalBackgroundY = Math.max(minBackgroundY, Math.min(maxBackgroundY, backgroundY))
  
  return {
    backgroundImage: `url(${watchItem.value.images[currentImageIndex.value]})`,
    backgroundSize: `${zoomedWidth}px ${zoomedHeight}px`,
    backgroundPosition: `${finalBackgroundX}px ${finalBackgroundY}px`,
    backgroundRepeat: 'no-repeat'
  }
})

// Price formatting
const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(price)
}

// Helper function to check if a value exists and is not empty
const hasValue = (value) => {
  return value !== null && value !== undefined && value !== '' && String(value).trim() !== ''
}

// Helper function to get article excerpt
const getArticleExcerpt = (text) => {
  if (!text) return ''
  // Remove markdown headers and formatting
  const cleanText = text.replace(/[#*`]/g, '').replace(/\n+/g, ' ').trim()
  // Return first 150 characters
  return cleanText.length > 150 ? cleanText.substring(0, 150) + '...' : cleanText
}

// Helper function to format article date
const formatArticleDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Navigate to article
const goToArticle = (articleId) => {
  const watchId = route.params.id
  router.push({
    path: `/blog/${articleId}`,
    query: { fromWatch: watchId }
  })
}

// Add to cart from product page
const handleAddToCart = () => {
  if (!watchItem.value || !watchItem.value.id) {
    return
  }
  const result = addToCart({
    watchId: watchItem.value.id,
    name: watchItem.value.name,
    reference: watchItem.value.reference,
    price: watchItem.value.price,
    imageUrl: watchItem.value.images?.[0] ?? null,
  })
  if (!result.ok) {
    alert(result.reason || 'Impossible d’ajouter au panier')
    return
  }
  openCartDrawer()
}

// SEO Meta Tags and Structured Data
const pageTitle = computed(() => {
  if (!watchItem.value) return seoWatch.titleFallback
  return `${watchItem.value.name} - ${formatPrice(watchItem.value.price)}${seoWatch.titlePriceSuffix}`
})

const pageDescription = computed(() => {
  if (!watchItem.value) return seoWatch.descriptionFallback
  const desc = watchItem.value.description || ''
  const brand = watchItem.value.brand || ''
  const ref = watchItem.value.reference || ''
  return `${desc || `Montre ${brand} ${ref}`.trim()}. Garantie 1 an, authentification certifiée. Prix: ${formatPrice(watchItem.value.price)}`
})

const ogImage = computed(() => {
  if (!watchItem.value || !watchItem.value.images || watchItem.value.images.length === 0) {
    return `${BASE_URL}/logo500x500.png`
  }
  return watchItem.value.images[0]
})

const canonicalUrl = computed(() => {
  return `${BASE_URL}/watch/${route.params.id}`
})

// Structured Data (JSON-LD)
const structuredData = computed(() => {
  if (!watchItem.value) return null
  
  const baseData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: watchItem.value.name,
    description: watchItem.value.description || `${watchItem.value.brand} ${watchItem.value.reference}`,
    image: watchItem.value.images || [],
    brand: {
      '@type': 'Brand',
      name: watchItem.value.brand || 'Marque inconnue',
    },
    sku: watchItem.value.reference || watchItem.value.id,
    offers: {
      '@type': 'Offer',
      price: watchItem.value.price,
      priceCurrency: 'EUR',
      availability: watchItem.value.isAvailable && !watchItem.value.isSold
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: canonicalUrl.value,
      seller: {
        '@type': 'Organization',
        name: seoWatch.structuredDataSellerName,
        url: BASE_URL,
      },
    },
  }

  // Add condition if available
  if (watchItem.value.condition) {
    baseData.itemCondition = `https://schema.org/${watchItem.value.condition === 'Neuf' ? 'NewCondition' : 'UsedCondition'}`
  }

  return baseData
})

// Update head when watch data changes
watch([watchItem, pageTitle, pageDescription, ogImage, canonicalUrl], () => {
  if (!watchItem.value) return

  useHead({
    title: pageTitle.value,
    meta: [
      {
        name: 'description',
        content: pageDescription.value,
      },
      {
        property: 'og:title',
        content: pageTitle.value,
      },
      {
        property: 'og:description',
        content: pageDescription.value,
      },
      {
        property: 'og:image',
        content: ogImage.value,
      },
      {
        property: 'og:url',
        content: canonicalUrl.value,
      },
      {
        property: 'og:type',
        content: 'product',
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: pageTitle.value,
      },
      {
        name: 'twitter:description',
        content: pageDescription.value,
      },
      {
        name: 'twitter:image',
        content: ogImage.value,
      },
    ],
    link: [
      {
        rel: 'canonical',
        href: canonicalUrl.value,
      },
    ],
    script: structuredData.value
      ? [
          {
            type: 'application/ld+json',
            children: JSON.stringify(structuredData.value),
          },
        ]
      : [],
  })
}, { immediate: true })

// Lightbox methods
const openLightbox = () => {
  isLightboxOpen.value = true
  // Prevent body and html scroll when lightbox is open
  document.body.style.overflow = 'hidden'
  document.documentElement.style.overflow = 'hidden'
  // Prevent scroll on touch devices
  document.body.style.position = 'fixed'
  document.body.style.width = '100%'
  document.body.style.top = `-${window.scrollY}px`
}

const closeLightbox = () => {
  isLightboxOpen.value = false
  // Restore body and html scroll
  const scrollY = document.body.style.top
  document.body.style.overflow = ''
  document.documentElement.style.overflow = ''
  document.body.style.position = ''
  document.body.style.width = ''
  document.body.style.top = ''
  if (scrollY) {
    const scrollPosition = parseInt(scrollY.replace('px', '') || '0', 10)
    window.scrollTo(0, Math.abs(scrollPosition))
  }
}

// Share lightbox methods
const openShareLightbox = () => {
  isShareLightboxOpen.value = true
  // Prevent body and html scroll when lightbox is open
  document.body.style.overflow = 'hidden'
  document.documentElement.style.overflow = 'hidden'
  // Prevent scroll on touch devices
  document.body.style.position = 'fixed'
  document.body.style.width = '100%'
  document.body.style.top = `-${window.scrollY}px`
}

const closeShareLightbox = () => {
  isShareLightboxOpen.value = false
  // Restore body and html scroll
  const scrollY = document.body.style.top
  document.body.style.overflow = ''
  document.documentElement.style.overflow = ''
  document.body.style.position = ''
  document.body.style.width = ''
  document.body.style.top = ''
  if (scrollY) {
    const scrollPosition = parseInt(scrollY.replace('px', '') || '0', 10)
    window.scrollTo(0, Math.abs(scrollPosition))
  }
}

// Share methods
const shareOnFacebook = () => {
  if (!watchItem.value) return
  const url = encodeURIComponent(canonicalUrl.value)
  const quote = watchItem.value.name ? encodeURIComponent(`${watchItem.value.name} - ${formatPrice(watchItem.value.price)}`) : ''
  const shareUrl = quote 
    ? `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}`
    : `https://www.facebook.com/sharer/sharer.php?u=${url}`
  window.open(shareUrl, '_blank', 'width=600,height=400')
  closeShareLightbox()
}

const shareOnTwitter = () => {
  if (!watchItem.value) return
  const url = encodeURIComponent(canonicalUrl.value)
  const text = encodeURIComponent(`${watchItem.value.name} - ${formatPrice(watchItem.value.price)}`)
  window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'width=600,height=400')
  closeShareLightbox()
}

const shareByEmail = () => {
  if (!watchItem.value) return
  const subject = encodeURIComponent(`Découvrez cette montre : ${watchItem.value.name}`)
  const refPart =
    catalogDisplay.showReference && watchItem.value.reference
      ? ` (Réf. ${watchItem.value.reference})`
      : ''
  const body = encodeURIComponent(`Je vous partage cette montre : ${watchItem.value.name}${refPart}\n\nPrix : ${formatPrice(watchItem.value.price)}\n\n${canonicalUrl.value}`)
  window.location.href = `mailto:?subject=${subject}&body=${body}`
  closeShareLightbox()
}

const copyUrl = async () => {
  if (!watchItem.value) return
  try {
    await navigator.clipboard.writeText(canonicalUrl.value)
    urlCopied.value = true
    setTimeout(() => {
      urlCopied.value = false
      closeShareLightbox()
    }, 1500)
  } catch (err) {
    console.error('Erreur lors de la copie de l\'URL:', err)
    // Fallback pour les navigateurs qui ne supportent pas l'API Clipboard
    const textArea = document.createElement('textarea')
    textArea.value = canonicalUrl.value
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      urlCopied.value = true
      setTimeout(() => {
        urlCopied.value = false
        closeShareLightbox()
      }, 1500)
    } catch (fallbackErr) {
      console.error('Erreur lors de la copie (fallback):', fallbackErr)
    }
    document.body.removeChild(textArea)
  }
}

// Handle ESC key press
const handleKeyDown = (event) => {
  if (event.key === 'Escape') {
    if (isLightboxOpen.value) {
      closeLightbox()
    }
    if (isShareLightboxOpen.value) {
      closeShareLightbox()
    }
  }
}

// Watch for lightbox state changes to handle focus and keyboard events
watch(isLightboxOpen, async (isOpen) => {
  if (isOpen) {
    await nextTick()
    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyDown)
    // Focus the lightbox overlay for keyboard navigation
    const overlay = document.querySelector('.lightbox-overlay')
    if (overlay) {
      overlay.focus()
    }
  } else {
    // Remove keyboard event listener only if share lightbox is also closed
    if (!isShareLightboxOpen.value) {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }
})

// Watch for share lightbox state changes
watch(isShareLightboxOpen, async (isOpen) => {
  if (isOpen) {
    await nextTick()
    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyDown)
    // Focus the lightbox overlay for keyboard navigation
    const overlay = document.querySelector('.lightbox-overlay')
    if (overlay) {
      overlay.focus()
    }
  } else {
    // Remove keyboard event listener only if image lightbox is also closed
    if (!isLightboxOpen.value) {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }
})

onMounted(async () => {
  await loadWatch()
  scrollAnimation()
  updateThumbnailScrollState()
  window.addEventListener('resize', updateThumbnailScrollState)
})

// Watch for route changes
watch(() => route.params.id, async (newId) => {
  if (newId) {
    await loadWatch()
  }
})

// Reset zoom and load image dimensions when image changes
watch(currentImageIndex, async () => {
  isHovering.value = false
  scrollActiveThumbnailIntoView()
  if (watchItem.value && watchItem.value.images && watchItem.value.images.length > 0) {
    await loadImageDimensions(watchItem.value.images[currentImageIndex.value])
  }
})

// Load image dimensions when watch item changes
watch(() => watchItem.value, async (newWatchItem) => {
  thumbnailRefs.value = []
  if (newWatchItem && newWatchItem.images && newWatchItem.images.length > 0) {
    await loadImageDimensions(newWatchItem.images[currentImageIndex.value])
    nextTick(updateThumbnailScrollState)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', updateThumbnailScrollState)
  // Cleanup: restore body scroll and remove event listeners
  document.body.style.overflow = ''
  document.documentElement.style.overflow = ''
  document.body.style.position = ''
  document.body.style.width = ''
  document.body.style.top = ''
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.prose {
  font-size: 1rem;
  line-height: 1.75;
}

/* Lightbox styles */
.lightbox-overlay {
  animation: fadeIn 0.3s ease-in-out;
  /* Ensure it's above everything */
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Zoom on hover styles - Desktop only */
.image-zoom-container {
  position: relative;
  /* Improve touch experience on mobile */
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

.zoom-preview {
  position: fixed;
  z-index: 1000;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  border: 2px solid rgba(0, 0, 0, 0.1);
  pointer-events: none;
  animation: zoomFadeIn 0.2s ease-out;
}

.zoom-preview-inner {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  background-color: white;
  transition: background-position 0.05s ease-out;
  will-change: background-position;
}

@keyframes zoomFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.thumbnail-strip {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.thumbnail-strip::-webkit-scrollbar {
  display: none;
}

/* Disable zoom on mobile/touch devices */
@media (max-width: 1023px) {
  .image-zoom-container {
    pointer-events: auto;
  }
  
  .zoom-preview {
    display: none !important;
  }
}
</style>
