'use client'
import Image from 'next/image'
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
  const router   = useRouter()
  const supabase = createClient()
  const { cls, txt } = ROLE_LABELS[profile.role] ?? ROLE_LABELS.user

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 100 }}>
      {/* Banner oficial */}
      <a
        href="https://parcuve.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="official-banner"
      >
        <i className="ti ti-world" />
        Conocé la web oficial de Parcuve
        <i className="ti ti-arrow-up-right" />
      </a>

      {/* Topbar principal */}
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image
            src="https://parcuve.com/wp-content/uploads/2026/04/logo-academia-parcuve-1.png"
            alt="Parcuve"
            width={36}
            height={36}
            style={{ objectFit: 'contain' }}
            unoptimized
          />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.1, letterSpacing: '-.01em' }}>
              Parcuve <span style={{ fontWeight: 300 }}>Sin Fronteras</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '.04em', textTransform: 'uppercase' }}>
              Atención psicológica
            </div>
          </div>
          <span className={`role-chip ${cls}`}>{txt}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>{profile.full_name}</span>
          <button className="btn btn-sm" onClick={logout}>
            <i className="ti ti-logout" /> Salir
          </button>
        </div>
      </div>
    </div>
  )
}
