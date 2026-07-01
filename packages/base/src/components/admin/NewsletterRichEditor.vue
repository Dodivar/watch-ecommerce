<script setup>
import { watch, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { Bold, Italic, Heading2, List, ListOrdered, Link2, Undo, Redo } from '@lucide/vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Link.configure({ openOnClick: false, autolink: true }),
  ],
  editorProps: {
    attributes: {
      class: 'prose max-w-none min-h-[280px] px-4 py-3 focus:outline-none',
    },
  },
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
})

// Synchronise si la valeur change depuis l'extérieur (chargement d'un brouillon).
watch(
  () => props.modelValue,
  (value) => {
    if (editor.value && value !== editor.value.getHTML()) {
      editor.value.commands.setContent(value || '', false)
    }
  },
)

function toggleLink() {
  if (!editor.value) return
  const previous = editor.value.getAttributes('link').href
  const url = window.prompt('URL du lien', previous || 'https://')
  if (url === null) return
  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

onBeforeUnmount(() => {
  editor.value?.destroy()
})

const btnBase =
  'p-2 rounded hover:bg-cream text-gray-600 hover:text-text-main transition-colors'
</script>

<template>
  <div class="border border-gray-300 rounded-lg overflow-hidden bg-white">
    <div v-if="editor" class="flex flex-wrap items-center gap-1 border-b border-gray-200 px-2 py-1.5 bg-gray-50">
      <button type="button" :class="[btnBase, editor.isActive('bold') ? 'bg-cream text-text-main' : '']" title="Gras" @click="editor.chain().focus().toggleBold().run()">
        <Bold class="w-4 h-4" :stroke-width="2" />
      </button>
      <button type="button" :class="[btnBase, editor.isActive('italic') ? 'bg-cream text-text-main' : '']" title="Italique" @click="editor.chain().focus().toggleItalic().run()">
        <Italic class="w-4 h-4" :stroke-width="2" />
      </button>
      <button type="button" :class="[btnBase, editor.isActive('heading', { level: 2 }) ? 'bg-cream text-text-main' : '']" title="Titre" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()">
        <Heading2 class="w-4 h-4" :stroke-width="2" />
      </button>
      <span class="w-px h-5 bg-gray-300 mx-1" />
      <button type="button" :class="[btnBase, editor.isActive('bulletList') ? 'bg-cream text-text-main' : '']" title="Liste à puces" @click="editor.chain().focus().toggleBulletList().run()">
        <List class="w-4 h-4" :stroke-width="2" />
      </button>
      <button type="button" :class="[btnBase, editor.isActive('orderedList') ? 'bg-cream text-text-main' : '']" title="Liste numérotée" @click="editor.chain().focus().toggleOrderedList().run()">
        <ListOrdered class="w-4 h-4" :stroke-width="2" />
      </button>
      <button type="button" :class="[btnBase, editor.isActive('link') ? 'bg-cream text-text-main' : '']" title="Lien" @click="toggleLink">
        <Link2 class="w-4 h-4" :stroke-width="2" />
      </button>
      <span class="w-px h-5 bg-gray-300 mx-1" />
      <button type="button" :class="btnBase" title="Annuler" @click="editor.chain().focus().undo().run()">
        <Undo class="w-4 h-4" :stroke-width="2" />
      </button>
      <button type="button" :class="btnBase" title="Rétablir" @click="editor.chain().focus().redo().run()">
        <Redo class="w-4 h-4" :stroke-width="2" />
      </button>
    </div>
    <EditorContent :editor="editor" />
  </div>
</template>

<style scoped>
:deep(.ProseMirror h2) {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0.75rem 0 0.5rem;
}
:deep(.ProseMirror p) {
  margin: 0.5rem 0;
}
:deep(.ProseMirror ul) {
  list-style: disc;
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}
:deep(.ProseMirror ol) {
  list-style: decimal;
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}
:deep(.ProseMirror a) {
  color: #2563eb;
  text-decoration: underline;
}
:deep(.ProseMirror:focus) {
  outline: none;
}
</style>
