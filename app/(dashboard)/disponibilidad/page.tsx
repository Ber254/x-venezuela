import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DisponibilidadClient from './DisponibilidadClient'

export default async function DisponibilidadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin','superadmin'].includes(profile.role)) redirect('/calendario')

  const [availRes, psicsRes] = await Promise.all([
    supabase.from('availability').select('*, profile:profiles!psic_id(id,full_name,color)').order('valid_from'),
    supabase.from('profiles').select('id,full_name').eq('role','psic').order('full_name'),
  ])

  return <DisponibilidadClient availability={availRes.data ?? []} psics={psicsRes.data ?? []} />
}
