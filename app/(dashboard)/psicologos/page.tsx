import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PsicologosClient from './PsicologosClient'

export default async function PsicologosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin','superadmin'].includes(profile.role)) redirect('/calendario')

  const { data: psics } = await supabase
    .from('profiles')
    .select('id,full_name,email,specialty,color,active,created_at')
    .eq('role', 'psic')
    .order('full_name')

  const { data: availability } = await supabase.from('availability').select('psic_id')

  return <PsicologosClient psics={psics ?? []} availability={availability ?? []} />
}
