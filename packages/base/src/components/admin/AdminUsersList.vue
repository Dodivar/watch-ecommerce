<script setup>
import { ref, onMounted } from 'vue'
import { getAdminUsersList } from '@/services/admin/adminUserService'
import AdminShell from './AdminShell.vue'

const users = ref([])
const error = ref(null)

onMounted(async () => {
  try {
    users.value = await getAdminUsersList()
  } catch (err) {
    error.value = err.message
  }
})
</script>

<template>
  <AdminShell title="Utilisateurs admin" content-class="max-w-lg">
      <div v-if="error" class="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4">{{ error }}</div>
      <ul class="bg-white rounded-lg shadow divide-y">
        <li v-for="u in users" :key="u.email" class="p-4">{{ u.email }}</li>
        <li v-if="users.length === 0" class="p-6 text-center text-gray-500">Aucun utilisateur ou accès refusé.</li>
      </ul>
  </AdminShell>
</template>
