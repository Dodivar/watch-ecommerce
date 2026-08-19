<template>
  <AProposRetail v-if="useRetailAbout" />
  <div v-else class="min-h-screen">
    <!-- Hero Section -->
    <section class="py-12">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-8">
          <h1 class="text-3xl lg:text-4xl font-bold text-text-main mb-3">
            {{ t('about.pageTitle', { brand: brandDisplayName }) }}
          </h1>
          <p class="text-xl text-gray-600 mb-3">
            {{ t('about.pageSubtitle') }}
          </p>
        </div>
      </div>
    </section>

    <!-- Qui sommes-nous -->
    <section class="py-10 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-8">
          <h2 class="text-3xl lg:text-4xl font-bold text-text-main mb-3">{{ t('about.whoWeAre') }}</h2>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto">
            {{ t('about.whoWeAreText', { brand: brandDisplayName }) }}
          </p>
        </div>
        <div class="grid md:grid-cols-2 gap-6 mt-8">
          <div class="bg-white rounded-md p-8 shadow-lg">
            <div class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-3">
              <svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-3">{{ t('about.ourMission') }}</h3>
            <p class="text-gray-600">
              {{ t('about.ourMissionText') }}
            </p>
          </div>
          <div class="bg-white rounded-md p-8 shadow-lg">
            <div class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
              <svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-3">{{ t('about.ourCommitment') }}</h3>
            <p class="text-gray-600">
              {{ t('about.ourCommitmentText') }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Notre différence -->
    <section class="py-10 bg-cream">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-8">
          <h2 class="text-3xl lg:text-4xl font-bold text-text-main mb-3">{{ t('about.ourDifference') }}</h2>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto">
            {{ t('about.ourDifferenceText') }}
          </p>
        </div>
        <div class="grid md:grid-cols-3 gap-6 mt-8">
          <div class="bg-white rounded-md p-6 shadow-lg text-center">
            <div class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
              <svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-3">{{ t('about.fullQualityControl') }}</h3>
            <p class="text-gray-600">
              {{ t('about.fullQualityControlText') }}
            </p>
          </div>
          <div class="bg-white rounded-md p-6 shadow-lg text-center">
            <div class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
              <svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-3">{{ t('about.immediateAvailability') }}</h3>
            <p class="text-gray-600">
              {{ t('about.immediateAvailabilityText') }}
            </p>
          </div>
          <div class="bg-white rounded-md p-6 shadow-lg text-center">
            <div class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
              <svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-3">{{ t('about.directCommunication') }}</h3>
            <p class="text-gray-600">
              {{ t('about.directCommunicationText') }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Nos valeurs -->
    <section class="py-10 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-8">
          <h2 class="text-3xl lg:text-4xl font-bold text-text-main mb-3">{{ t('about.ourValues') }}</h2>
        </div>
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="text-center">
            <div class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
              <svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2">{{ t('about.authenticity') }}</h3>
            <p class="text-gray-600">
              {{ t('about.authenticityText') }}
            </p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
              <svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2">{{ t('about.transparency') }}</h3>
            <p class="text-gray-600">
              {{ t('about.transparencyText') }}
            </p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
              <svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2">{{ t('about.expertise') }}</h3>
            <p class="text-gray-600">
              {{ t('about.expertiseText') }}
            </p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
              <svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2">{{ t('about.satisfaction') }}</h3>
            <p class="text-gray-600">
              {{ t('about.satisfactionText') }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Garanties et sécurité -->
    <section class="py-10 bg-cream">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-8">
          <h2 class="text-3xl lg:text-4xl font-bold text-text-main mb-3">{{ t('about.guaranteesSecurity') }}</h2>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto">
            {{ t('about.guaranteesSecurityText') }}
          </p>
        </div>
        <div class="grid md:grid-cols-2 gap-8 mt-12">
          <div class="bg-white rounded-md p-8 shadow-lg">
            <div class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
              <svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-3">{{ t('about.guaranteedAuthentication') }}</h3>
            <p class="text-gray-600 mb-3">
              {{ t('about.guaranteedAuthenticationText') }}
            </p>
            <ul class="space-y-2 text-gray-600">
              <li class="flex items-start">
                <svg class="h-5 w-5 text-primary mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                {{ t('about.checkAuthenticity') }}
              </li>
              <li class="flex items-start">
                <svg class="h-5 w-5 text-primary mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                {{ t('about.checkCondition') }}
              </li>
              <li class="flex items-start">
                <svg class="h-5 w-5 text-primary mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                {{ t('about.checkPapers') }}
              </li>
              <li class="flex items-start">
                <svg class="h-5 w-5 text-primary mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                {{ t('about.transactionWarranty') }}
              </li>
            </ul>
          </div>
          <div class="bg-white rounded-md p-8 shadow-lg">
            <div class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
              <svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-3">{{ t('about.securePayment') }}</h3>
            <p class="text-gray-600 mb-3">
              {{ t('about.securePaymentText') }}
            </p>
            <ul class="space-y-2 text-gray-600">
              <li class="flex items-start">
                <svg class="h-5 w-5 text-primary mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                {{ t('about.secureTransactions') }}
              </li>
              <li class="flex items-start">
                <svg class="h-5 w-5 text-primary mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                {{ t('about.dataProtection') }}
              </li>
              <li class="flex items-start">
                <svg class="h-5 w-5 text-primary mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                {{ t('about.realTimeOrderTracking') }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Livraison sécurisée -->
    <section class="py-10 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-primary/10 rounded-md p-8 md:p-12">
          <div class="text-center mb-8">
            <div class="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <svg class="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h2 class="text-3xl lg:text-4xl font-bold text-text-main mb-4">{{ t('about.secureInsuredDelivery') }}</h2>
            <p class="text-xl text-gray-600 max-w-3xl mx-auto">
            {{ t('about.secureInsuredDeliveryText') }}
            </p>
          </div>
          <div class="grid md:grid-cols-3 gap-6 mt-8">
            <div class="bg-white rounded-md p-6 text-center">
              <div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 class="text-lg font-semibold mb-2">{{ t('about.securePackage') }}</h3>
              <p class="text-gray-600 text-sm">
                {{ t('about.securePackageText') }}
              </p>
            </div>
            <div class="bg-white rounded-md p-6 text-center">
              <div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 class="text-lg font-semibold mb-2">{{ t('about.declaredValueInsurance') }}</h3>
              <p class="text-gray-600 text-sm">
                {{ t('about.declaredValueInsuranceText') }}
              </p>
            </div>
            <div class="bg-white rounded-md p-6 text-center">
              <div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 class="text-lg font-semibold mb-2">{{ t('about.realTimeTracking') }}</h3>
              <p class="text-gray-600 text-sm">
                {{ t('about.realTimeTrackingText') }}
              </p>
            </div>
          </div>
          <div class="mt-8 text-center">
            <p class="text-gray-700 font-medium">
              <strong>{{ t('about.goodHandsTitle') }}</strong> {{ t('about.goodHandsText') }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Notre expertise -->
    <section class="py-10 bg-cream">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-8">
          <h2 class="text-3xl lg:text-4xl font-bold text-text-main mb-3">{{ t('about.ourExpertise') }}</h2>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto">
            {{ t('about.ourExpertiseText') }}
          </p>
        </div>
        <div class="grid md:grid-cols-2 gap-8 mt-12">
          <div class="bg-white rounded-md p-8 shadow-lg">
            <h3 class="text-xl font-semibold mb-3">{{ t('about.specialisedTeam') }}</h3>
            <p class="text-gray-600 mb-3">
              {{ t('about.specialisedTeamText') }}
            </p>
            <ul class="space-y-2 text-gray-600">
              <li class="flex items-start">
                <svg class="h-5 w-5 text-primary mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                {{ t('about.luxuryWatchExpertise') }}
              </li>
              <li class="flex items-start">
                <svg class="h-5 w-5 text-primary mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                {{ t('about.marketKnowledge') }}
              </li>
              <li class="flex items-start">
                <svg class="h-5 w-5 text-primary mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                {{ t('about.personalSupport') }}
              </li>
            </ul>
          </div>
          <div class="bg-white rounded-md p-8 shadow-lg">
            <h3 class="text-xl font-semibold mb-3">{{ t('about.networkSourcing') }}</h3>
            <p class="text-gray-600 mb-3">
              {{ t('about.networkSourcingText') }}
            </p>
            <ul class="space-y-2 text-gray-600">
              <li class="flex items-start">
                <svg class="h-5 w-5 text-primary mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                {{ t('about.professionalNetwork') }}
              </li>
              <li class="flex items-start">
                <svg class="h-5 w-5 text-primary mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                {{ t('about.accessRarePieces') }}
              </li>
              <li class="flex items-start">
                <svg class="h-5 w-5 text-primary mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                {{ t('about.constantMarketWatch') }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Pourquoi nous choisir -->
    <section class="py-10 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-8">
          <h2 class="text-3xl lg:text-4xl font-bold text-text-main mb-3">{{ t('about.whyChooseUs') }}</h2>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto">
            {{ t('about.whyChooseUsText') }}
          </p>
        </div>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <div class="bg-white rounded-md p-6 shadow-lg">
            <div class="text-primary text-3xl mb-3">⚡</div>
            <h3 class="text-lg font-semibold mb-3">{{ t('about.shorterLeadTimes') }}</h3>
            <p class="text-gray-600">
              {{ t('about.shorterLeadTimesText') }}
            </p>
          </div>
          <div class="bg-white rounded-md p-6 shadow-lg">
            <div class="text-primary text-3xl mb-3">🎯</div>
            <h3 class="text-lg font-semibold mb-3">{{ t('about.transparentPrices') }}</h3>
            <p class="text-gray-600">
              {{ t('about.transparentPricesText') }}
            </p>
          </div>
          <div class="bg-white rounded-md p-6 shadow-lg">
            <div class="text-primary text-3xl mb-3">🤝</div>
            <h3 class="text-lg font-semibold mb-3">{{ t('about.directRelationship') }}</h3>
            <p class="text-gray-600">
              {{ t('about.directCommunicationText') }}
            </p>
          </div>
          <div class="bg-white rounded-md p-6 shadow-lg">
            <div class="text-primary text-3xl mb-3">✅</div>
            <h3 class="text-lg font-semibold mb-3">{{ t('about.guaranteedQuality') }}</h3>
            <p class="text-gray-600">
              {{ t('about.guaranteedQualityText') }}
            </p>
          </div>
          <div class="bg-white rounded-md p-6 shadow-lg">
            <div class="text-primary text-3xl mb-3">📦</div>
            <h3 class="text-lg font-semibold mb-3">{{ t('about.secureDelivery') }}</h3>
            <p class="text-gray-600">
              {{ t('about.secureDeliveryText') }}
            </p>
          </div>
          <div class="bg-white rounded-md p-6 shadow-lg">
            <div class="text-primary text-3xl mb-3">🛡️</div>
            <h3 class="text-lg font-semibold mb-3">{{ t('about.warrantyService') }}</h3>
            <p class="text-gray-600">
              {{ t('about.warrantyServiceText') }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Nous trouver -->
    <section
      v-if="storeMap?.enabled && storeMap?.center && typeof storeMap.center.lat === 'number'"
      class="py-10 bg-cream"
    >
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-8">
          <h2 class="text-3xl lg:text-4xl font-bold text-text-main mb-3">{{ t('about.findUs') }}</h2>
        </div>
        <StoreLocationMap />
      </div>
    </section>

    <!-- Call to action -->
    <section v-if="features.collection || features.recherche" class="py-10 bg-primary text-white">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl lg:text-4xl font-bold mb-3">{{ t('about.ctaTitle') }}</h2>
        <p class="text-xl mb-6 opacity-90">
          {{ t('about.ctaText') }}
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <RouterLink
            v-if="features.collection"
            to="/collection"
            class="inline-flex items-center bg-white text-primary px-8 py-4 rounded-lg text-lg font-semibold hover:bg-cream-100 transition-all shadow-lg"
          >
            {{ t('watch.seeOurCollection') }}
          </RouterLink>
          <RouterLink
            v-if="features.recherche"
            to="/recherche"
            class="inline-flex items-center border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/10 transition-all"
          >
            {{ t('home.heroSourcingCta') }}
          </RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useHead } from '@vueuse/head'
import { CANONICAL_BASE_URL } from '@/config'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import StoreLocationMap from '@/components/StoreLocationMap.vue'
import AProposRetail from '@/components/AProposRetail.vue'
import { t } from '@/i18n'

const site = getSiteConfig()
const useRetailAbout = computed(() => site.about?.variant === 'retail')
const brandDisplayName = site.brand.displayName
const seo = site.seo.aPropos
const features = site.features
const storeMap = site.storeMap

// SEO Meta Tags (la variante retail gère son propre useHead)
useHead(
  computed(() => {
    if (site.about?.variant === 'retail') return {}
    return {
      title: seo.title,
      meta: [
        { name: 'description', content: seo.metaDescription },
        { property: 'og:title', content: seo.ogTitle },
        { property: 'og:description', content: seo.ogDescription },
        { property: 'og:url', content: `${CANONICAL_BASE_URL}/a-propos` },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: seo.twitterTitle },
        { name: 'twitter:description', content: seo.twitterDescription },
      ],
      link: [{ rel: 'canonical', href: `${CANONICAL_BASE_URL}/a-propos` }],
    }
  }),
)
</script>

<script>
export default {
  name: 'APropos',
}
</script>

