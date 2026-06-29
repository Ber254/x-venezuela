import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminsClient from './AdminsClient'

export default async function AdminsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'superadmin') redirect('/calendario')

  const { data: admins } = await supabase
    .from('profiles')
    .select('id,full_name,email,active,created_at')
    .eq('role', 'admin')
    .order('full_name')

  return <AdminsClient admins={admins ?? []} />
}
