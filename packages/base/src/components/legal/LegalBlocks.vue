<script setup>
import LegalInline from './LegalInline.vue'

/** Blocs d'un document juridique ; se rappelle lui-même pour les encadrés (`notice`). */
defineOptions({ name: 'LegalBlocks' })
defineProps({
  blocks: { type: Array, required: true },
})
</script>

<template>
  <template v-for="(block, i) in blocks" :key="i">
    <p v-if="block.type === 'p'"><LegalInline :text="block.text" /></p>
    <h3 v-else-if="block.type === 'h3'" class="text-lg font-semibold text-text-main pt-2">
      {{ block.text }}
    </h3>
    <p v-else-if="block.type === 'lines'">
      <template v-for="(line, j) in block.lines" :key="j">
        <br v-if="j > 0" />
        <LegalInline :text="line" />
      </template>
    </p>
    <ul v-else-if="block.type === 'list'" class="list-disc pl-5 space-y-1">
      <li v-for="(item, j) in block.items" :key="j"><LegalInline :text="item" /></li>
    </ul>
    <div
      v-else-if="block.type === 'notice'"
      class="rounded-lg border-2 border-current/30 p-4 sm:p-5 space-y-3 text-sm"
    >
      <LegalBlocks :blocks="block.blocks" />
    </div>
  </template>
</template>
