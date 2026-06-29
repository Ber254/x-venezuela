'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Role } from '@/types'

interface NavItem {
  href: string
  icon: string
  label: string
  roles: Role[]
}

const NAV: NavItem[] = [
  { href: '/calendario',    icon: 'ti-calendar-week',  label: 'Calendario',     roles: ['superadmin','admin','psic'] },
  { href: '/psicologos',    icon: 'ti-users',           label: 'Psicólogos',     roles: ['superadmin','admin'] },
  { href: '/disponibilidad',icon: 'ti-clock',           label: 'Disponibilidad', roles: ['superadmin','admin'] },
  { href: '/admins',        icon: 'ti-shield',          label: 'Administradores',roles: ['superadmin'] },
  { href: '/inasistencias', icon: 'ti-user-x',          label: 'Inasistencias',  roles: ['psic'] },
  { href: '/reportes',      icon: 'ti-chart-bar',       label: 'Reportes',       roles: ['superadmin'] },
  { href: '/base-datos',    icon: 'ti-database',        label: 'Base de datos',  roles: ['superadmin'] },
  { href: '/reservar',      icon: 'ti-calendar-plus',   label: 'Reservar turno', roles: ['user'] },
  { href: '/mis-turnos',    icon: 'ti-calendar-check',  label: 'Mis turnos',     roles: ['user'] },
]

export default function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname()
  const visible  = NAV.filter(n => n.roles.includes(role))

  return (
    <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ padding: '0 6px' }}>
        <div className="nav-lbl">Menú</div>
        {visible.map(n => (
          <Link
            key={n.href}
            href={n.href}
            className={`nav-i${pathname === n.href ? ' active' : ''}`}
          >
            <i className={`ti ${n.icon}`} />
            {n.label}
          </Link>
        ))}
      </div>

      {/* Link al sitio oficial abajo del sidebar */}
      <div style={{ padding: '1rem 14px', borderTop: '1px solid var(--border)' }}>
        <a
          href="https://parcuve.com/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 11, color: 'var(--text3)', textDecoration: 'none',
            padding: '6px 8px', borderRadius: 6, transition: '.12s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <i className="ti ti-world" style={{ fontSize: 14 }} />
          <span>parcuve.com</span>
          <i className="ti ti-arrow-up-right" style={{ fontSize: 11, marginLeft: 'auto', opacity: .5 }} />
        </a>
      </div>
    </div>
  )
}
