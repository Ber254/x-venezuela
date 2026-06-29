import Image from 'next/image'
import LandingBooking from '@/components/LandingBooking'
import { createServiceClient } from '@/lib/supabase/server'
import { slotsFromShift } from '@/lib/utils'

// Revalidar cada 60 segundos
export const revalidate = 60

async function getPublicSlots() {
  const supabase = await createServiceClient()
  const today   = new Date()
  const from    = today.toISOString().split('T')[0]
  const toDate  = new Date(today); toDate.setDate(toDate.getDate() + 13)
  const to      = toDate.toISOString().split('T')[0]

  const [psicsRes, availRes, bookingsRes] = await Promise.all([
    supabase.from('profiles').select('id,full_name,specialty,color').eq('role','psic').eq('active',true),
    supabase.from('availability').select('*').lte('valid_from', to).gte('valid_until', from),
    supabase.from('bookings').select('date,hour,psic_id').gte('date', from).lte('date', to),
  ])

  const psics    = psicsRes.data    ?? []
  const avails   = availRes.data    ?? []
  const bookings = bookingsRes.data ?? []

  const result: Record<string, { hour: string; psics: { id: string; name: string; specialty: string; color: string }[] }[]> = {}

  for (let i = 0; i < 14; i++) {
    const d   = new Date(today); d.setDate(d.getDate() + i)
    const ds  = d.toISOString().split('T')[0]
    const dow = d.getDay()
    const slotMap: Record<string, { id: string; name: string; specialty: string; color: string }[]> = {}

    psics.forEach(psic => {
      avails.filter(av =>
        av.psic_id === psic.id &&
        av.valid_from <= ds && av.valid_until >= ds &&
        (av.days as number[]).includes(dow)
      ).forEach(av => {
        (av.shifts as { start: string; end: string }[]).forEach(sh => {
          slotsFromShift(sh.start, sh.end).forEach(hour => {
            if (!bookings.find(b => b.date === ds && b.psic_id === psic.id && b.hour === hour)) {
              if (!slotMap[hour]) slotMap[hour] = []
              slotMap[hour].push({ id: psic.id, name: psic.full_name, specialty: psic.specialty ?? '', color: psic.color ?? '#1A1A18' })
            }
          })
        })
      })
    })

    if (Object.keys(slotMap).length > 0) {
      result[ds] = Object.entries(slotMap).sort(([a],[b]) => a.localeCompare(b)).map(([hour, psics]) => ({ hour, psics }))
    }
  }

  return result
}

export default async function Home() {
  const slots = await getPublicSlots()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: "'Inter', sans-serif" }}>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <header style={{ background: '#fff', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
        {/* Banner oficial */}
        <a
          href="https://parcuve.com/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--primary)', color: '#fff', padding: '6px 1rem', fontSize: 11, fontWeight: 500, textDecoration: 'none', letterSpacing: '.02em' }}
        >
          <i className="ti ti-world" style={{ fontSize: 13 }} />
          Conocé la web oficial de Parcuve en parcuve.com
          <i className="ti ti-arrow-up-right" style={{ fontSize: 11, opacity: .7 }} />
        </a>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Image
              src="https://parcuve.com/wp-content/uploads/2026/04/logo-academia-parcuve-1.png"
              alt="Parcuve"
              width={40}
              height={40}
              style={{ objectFit: 'contain' }}
              unoptimized
            />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-.02em', lineHeight: 1.1 }}>
                Parcuve <span style={{ fontWeight: 300 }}>Sin Fronteras</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                Atención psicológica gratuita
              </div>
            </div>
          </div>
          <a
            href="/acceso-profesional"
            style={{ fontSize: 12, color: 'var(--text3)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <i className="ti ti-lock" style={{ fontSize: 13 }} />
            Acceso profesional
          </a>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section style={{ background: 'var(--primary)', color: '#fff', padding: '3.5rem 1.5rem 3rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.12)', borderRadius: 20, padding: '4px 14px', fontSize: 11, fontWeight: 500, marginBottom: '1.25rem', letterSpacing: '.04em', textTransform: 'uppercase' }}>
            <i className="ti ti-heart" style={{ fontSize: 12 }} />
            Atención gratuita · Sin costo · Sin fronteras
          </div>
          <h1 style={{ fontSize: 'clamp(26px, 5vw, 40px)', fontWeight: 700, lineHeight: 1.15, marginBottom: '1rem', letterSpacing: '-.02em' }}>
            Tu bienestar mental<br />
            <span style={{ fontWeight: 300, fontStyle: 'italic' }}>es un derecho</span>
          </h1>
          <p style={{ fontSize: 15, opacity: .82, lineHeight: 1.7, marginBottom: '1.75rem' }}>
            Reservá una sesión gratuita con nuestros psicólogos. Sin lista de espera, sin burocracia — elegí el horario que más te convenga.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { icon: 'ti-video', txt: 'Sesión por Google Meet' },
              { icon: 'ti-clock', txt: '1 hora por sesión' },
              { icon: 'ti-calendar-check', txt: 'Hasta 3 turnos por semana' },
            ].map(({ icon, txt }) => (
              <div key={txt} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, opacity: .85 }}>
                <i className={`ti ${icon}`} style={{ fontSize: 14 }} />
                {txt}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOOKING ────────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
        <div style={{ marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.01em', marginBottom: 6 }}>
            Turnos disponibles
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
            Elegí día y horario. Al confirmar te pedimos tu correo para enviarte el enlace de la videollamada.
          </p>
        </div>

        <LandingBooking initialSlots={slots} />
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--border)', background: '#fff', padding: '1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
          <Image
            src="https://parcuve.com/wp-content/uploads/2026/04/logo-academia-parcuve-1.png"
            alt="Parcuve"
            width={24}
            height={24}
            style={{ objectFit: 'contain', opacity: .6 }}
            unoptimized
          />
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>
            © {new Date().getFullYear()} Parcuve Sin Fronteras ·{' '}
            <a href="https://parcuve.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text3)' }}>
              parcuve.com
            </a>
          </span>
        </div>
      </footer>

      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css"
      />
    </div>
  )
}
