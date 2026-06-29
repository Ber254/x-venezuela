import Image from 'next/image'
import LandingBooking from '@/components/LandingBooking'
import { createServiceClient } from '@/lib/supabase/server'
import { slotsFromShift } from '@/lib/utils'

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
              slotMap[hour].push({ id: psic.id, name: psic.full_name, specialty: psic.specialty ?? '', color: psic.color ?? '#2D3580' })
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

const FLAGS = ['🇪🇸','🇦🇷','🇨🇷','🇨🇱','🇵🇪','🇲🇽']

export default async function Home() {
  const slots = await getPublicSlots()

  return (
    <div style={{ minHeight: '100vh', background: '#F8F7FC', fontFamily: "'Inter', sans-serif" }}>

      <style>{`
        :root {
          --psf-navy: #2D3580;
          --psf-rose: #C17A9F;
          --psf-light: #F0EEF8;
          --psf-border: rgba(45,53,128,.10);
        }
        .psf-card-slot {
          background: #fff;
          border: 1.5px solid var(--psf-border);
          border-radius: 12px;
          padding: 14px 16px;
          cursor: pointer;
          transition: all .15s;
          font-family: 'Inter', sans-serif;
          text-align: left;
        }
        .psf-card-slot:hover {
          border-color: var(--psf-navy);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(45,53,128,.12);
        }
      `}</style>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <header style={{ background: '#fff', borderBottom: '1px solid var(--psf-border)', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(45,53,128,.06)' }}>
        {/* Banner oficial */}
        <a
          href="https://parcuve.com/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--psf-navy)', color: '#fff', padding: '6px 1rem', fontSize: 11, fontWeight: 500, textDecoration: 'none', letterSpacing: '.03em' }}
        >
          <i className="ti ti-world" style={{ fontSize: 13 }} />
          Conocé la web oficial de Parcuve en parcuve.com
          <i className="ti ti-arrow-up-right" style={{ fontSize: 11, opacity: .7 }} />
        </a>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Image
              src="/logo-parcuve-sin-fronteras.png"
              alt="Parcuve Sin Fronteras"
              width={120}
              height={120}
              style={{ objectFit: 'contain' }}
            />
          </div>
          <a
            href="/acceso-profesional"
            style={{ fontSize: 12, color: '#9A998F', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 6, border: '1px solid #E0DFDA', transition: '.12s' }}
          >
            <i className="ti ti-lock" style={{ fontSize: 13 }} />
            Acceso profesional
          </a>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(135deg, var(--psf-navy) 0%, #3D4A9E 60%, #6B5B9E 100%)', color: '#fff', padding: '4rem 1.5rem 3.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>

          {/* Banderas */}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: '1.5rem' }}>
            {FLAGS.map(f => (
              <span key={f} style={{ fontSize: 22 }}>{f}</span>
            ))}
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.15)', borderRadius: 20, padding: '5px 16px', fontSize: 11, fontWeight: 600, marginBottom: '1.25rem', letterSpacing: '.06em', textTransform: 'uppercase' }}>
            <i className="ti ti-heart" style={{ fontSize: 12 }} />
            Atención gratuita · Sin costo · Sin fronteras
          </div>

          <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 700, lineHeight: 1.15, marginBottom: '1rem', letterSpacing: '-.02em' }}>
            Tu bienestar mental<br />
            <span style={{ fontWeight: 300, fontStyle: 'italic', color: '#E8C8DA' }}>es un derecho</span>
          </h1>

        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section style={{ background: '#fff', borderBottom: '1px solid var(--psf-border)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '2rem 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {[
            { n: '1', icon: 'ti-calendar', title: 'Elegí un turno', desc: 'Seleccioná el día y horario que más te convenga.' },
            { n: '2', icon: 'ti-mail', title: 'Confirmá por email', desc: 'Te enviamos un enlace mágico — sin contraseña.' },
            { n: '3', icon: 'ti-video', title: 'Entrá al Meet', desc: 'Tu sesión online, completamente confidencial.' },
          ].map(({ n, icon, title, desc }) => (
            <div key={n} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--psf-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={`ti ${icon}`} style={{ fontSize: 16, color: 'var(--psf-navy)' }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--psf-navy)', marginBottom: 3 }}>{title}</div>
                <div style={{ fontSize: 12, color: '#6B6B62', lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── BOOKING ────────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
        <div style={{ marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.01em', marginBottom: 6, color: 'var(--psf-navy)' }}>
            Turnos disponibles
          </h2>
          <p style={{ fontSize: 13, color: '#6B6B62', lineHeight: 1.6 }}>
            Elegí día y horario. Al confirmar te pedimos tu correo para enviarte el enlace de la videollamada.
          </p>
        </div>

        <LandingBooking initialSlots={slots} />
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--psf-border)', background: '#fff', padding: '2rem 1.5rem', textAlign: 'center' }}>
        <Image
          src="/logo-parcuve-sin-fronteras.png"
          alt="Parcuve Sin Fronteras"
          width={80}
          height={80}
          style={{ objectFit: 'contain', opacity: .7, marginBottom: 8 }}
        />
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 12 }}>
          {FLAGS.map(f => <span key={f} style={{ fontSize: 16 }}>{f}</span>)}
        </div>
        <div style={{ fontSize: 12, color: '#9A998F' }}>
          © {new Date().getFullYear()} Parcuve Sin Fronteras ·{' '}
          <a href="https://parcuve.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#9A998F' }}>
            parcuve.com
          </a>
        </div>
      </footer>

      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css" />
    </div>
  )
}
