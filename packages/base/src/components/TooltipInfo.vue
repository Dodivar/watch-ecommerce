<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { Info } from '@lucide/vue'

defineProps({
  tooltipText: {
    type: String,
    required: true,
  },
})

const tooltipRef = ref(null)
const triggerRef = ref(null)

// Gérer le clic en dehors du tooltip
const handleClickOutside = (event) => {
  if (
    tooltipRef.value &&
    !tooltipRef.value.contains(event.target) &&
    triggerRef.value &&
    !triggerRef.value.contains(event.target)
  ) {
    hideTooltip()
  }
}

function showTooltip() {
  if (tooltipRef.value) {
    tooltipRef.value.classList.add('show')
    tooltipRef.value.dataset.clicked = 'true'
    positionTooltip()
  }
}

function hideTooltip() {
  if (tooltipRef.value) {
    tooltipRef.value.classList.remove('show')
    delete tooltipRef.value.dataset.clicked
  }
}

function toggleTooltip(e) {
  e.preventDefault()
  e.stopPropagation()
  if (tooltipRef.value.classList.contains('show')) {
    hideTooltip()
  } else {
    showTooltip()
  }
}

function handleMouseEnter() {
  showTooltip()
}

function handleMouseLeave() {
  hideTooltip()
}

function positionTooltip() {
  if (!tooltipRef.value) return
  const trigger = triggerRef.value
  const tooltip = tooltipRef.value
  const tooltipContent = tooltip.querySelector('.tooltip-content')
  if (!trigger || !tooltipContent) return
  const triggerRect = trigger.getBoundingClientRect()
  const tooltipRect = tooltipContent.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  tooltip.classList.remove('tooltip-left', 'tooltip-right', 'tooltip-center')
  if (window.innerWidth <= 640) {
    tooltip.classList.add('tooltip-center')
  } else {
    if (triggerRect.left + tooltipRect.width > viewportWidth) {
      tooltip.classList.add('tooltip-right')
    } else if (triggerRect.left - tooltipRect.width < 0) {
      tooltip.classList.add('tooltip-left')
    } else {
      tooltip.classList.add('tooltip-center')
    }
  }
}

onMounted(() => {
  window.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', positionTooltip)
  if (triggerRef.value) {
    triggerRef.value.addEventListener('mouseenter', handleMouseEnter)
    triggerRef.value.addEventListener('mouseleave', handleMouseLeave)
    triggerRef.value.addEventListener('click', toggleTooltip)
  }
})

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', positionTooltip)
  if (triggerRef.value) {
    triggerRef.value.removeEventListener('mouseenter', handleMouseEnter)
    triggerRef.value.removeEventListener('mouseleave', handleMouseLeave)
    triggerRef.value.removeEventListener('click', toggleTooltip)
  }
})
</script>

<template>
  <div class="relative">
    <Info
      ref="triggerRef"
      class="tooltip-trigger text-subtle hover:text-muted cursor-help w-5 h-5"
      :stroke-width="2"
    />
    <!-- Tooltip -->
    <div ref="tooltipRef" class="tooltip absolute bottom-full mb-2 z-10">
      <div
        class="tooltip-content bg-gray-800 text-white text-sm rounded-lg py-2 px-3 shadow-lg min-w-[350px] max-w-[450px] sm:max-w-[450px] md:max-w-[500px] lg:max-w-[600px] xl:max-w-[700px]"
      >
        {{ tooltipText }}
        <!-- Flèche du tooltip -->
        <div
          class="tooltip-arrow absolute top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tooltip {
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.2s,
    visibility 0.2s;
}

.tooltip.show {
  opacity: 1;
  visibility: visible;
}

/* Positionnement du tooltip */
.tooltip-center {
  left: 50%;
  transform: translateX(-50%);
}

.tooltip-center .tooltip-arrow {
  left: 50%;
  transform: translateX(-50%);
}

.tooltip-right {
  right: 0;
}

.tooltip-right .tooltip-arrow {
  right: 1rem;
}

.tooltip-left {
  left: 0;
}

.tooltip-left .tooltip-arrow {
  left: 1rem;
}

/* Animation */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 640px) {
  .tooltip-content {
    white-space: normal;
    word-wrap: break-word;
  }

  .tooltip-trigger {
    cursor: pointer;
  }

  .tooltip {
    position: fixed;
    bottom: auto;
    left: 50%;
    transform: translateX(-50%);
    width: 90%;
    max-width: 450px;
  }

  .tooltip.show {
    animation: slideUp 0.2s ease-out;
  }

  .tooltip-arrow {
    visibility: hidden;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translate(-50%, 10px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }
}
</style>
