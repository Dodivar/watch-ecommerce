import { supabase } from '../supabase'

export async function getAdminUsersList() {
  const { data, error } = await supabase.from('admin_users').select('email').order('email')
  if (error) throw new Error(error.message)
  return data || []
}
