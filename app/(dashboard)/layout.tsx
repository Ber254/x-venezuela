import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import Topbar  from '@/components/layout/Topbar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id,full_name,email,role,specialty,color,active')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Topbar profile={profile} />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar role={profile.role} />
        <main style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
