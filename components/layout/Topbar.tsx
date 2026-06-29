'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types'

const ROLE_LABELS: Record<string, { cls: string; txt: string }> = {
  superadmin: { cls: 'chip-super', txt: 'SuperAdmin' },
  admin:      { cls: 'chip-admin', txt: 'Admin' },
  psic:       { cls: 'chip-psic',  txt: 'Psicólogo/a' },
  user:       { cls: 'chip-user',  txt: 'En atención' },
}

export default function Topbar({ profile }: { profile: Profile }) {
  const router  = useRouter()
  const supabase = createClient()
  const { cls, txt } = ROLE_LABELS[profile.role] ?? ROLE_LABELS.user

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div className="logo-box"><i className="ti ti-heart-handshake" /></div>
        <span style={{ fontSize: 15, fontWeight: 600 }}>
          Parcuve <span style={{ color: 'var(--green)' }}>Sin Fronteras</span>
        </span>
        <span className={`role-chip ${cls}`}>{txt}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--text2)' }}>{profile.full_name}</span>
        <button className="btn btn-sm" onClick={logout}>
          <i className="ti ti-logout" /> Salir
        </button>
      </div>
    </div>
  )
}
