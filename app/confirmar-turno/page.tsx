'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { hourEnd } from '@/lib/utils'
import Link from 'next/link'

type Status = 'loading' | 'confirming' | 'success' | 'already_done' | 'error' | 'no_pending'

export default function ConfirmarTurnoPage() {
  const [status, setStatus]   = useState<Status>('loading')
  const [meetLink, setMeetLink] = useState('')
  const [bookingInfo, setBookingInfo] = useState<{ date: string; hour: string; psic: string } | null>(null)
  const [error, setError]     = useState('')

  useEffect(() => {
    async function run() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setStatus('error'); setError('No se pudo verificar tu sesión. Intentá de nuevo.'); return }

      const raw = sessionStorage.getItem('pending_booking')
      if (!raw) { setStatus('no_pending'); return }

      let pending: { date: string; hour: string; psic_id: string }
      try { pending = JSON.parse(raw) } catch { setStatus('no_pending'); return }

      sessionStorage.removeItem('pending_booking')
      setStatus('confirming')

      try {
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pending),
        })
        const data = await res.json()

        if (res.ok) {
          setMeetLink(data.meet_link ?? '')
          // Get psic name
          const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', pending.psic_id).single()
          setBookingInfo({ date: pending.date, hour: pending.hour, psic: profile?.full_name ?? 'Psicólogo' })
          setStatus('success')
        } else if (res.status === 409) {
          setStatus('already_done')
        } else {
          setStatus('error'); setError(data.error ?? 'No se pudo confirmar el turno.')
        }
      } catch {
        setStatus('error'); setError('Error de red. Intentá de nuevo.')
      }
    }
    run()
  }, [])

  const dateLabel = (ds: string) => {
    const d = new Date(ds + 'T12:00:00')
    return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', padding: '2.5rem', maxWidth: 440, width: '100%', boxShadow: '0 4px 32px rgba(0,0,0,.07)', textAlign: 'center' }}>

        {(status === 'loading' || status === 'confirming') && (
          <>
            <div style={{ width: 60, height: 60, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 1.5rem', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
              {status === 'loading' ? 'Verificando sesión…' : 'Confirmando tu turno…'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>Un momento por favor</div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </>
        )}

        {status === 'success' && bookingInfo && (
          <>
            <div style={{ width: 72, height: 72, background: 'var(--surface2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <i className="ti ti-circle-check" style={{ fontSize: 38, color: 'var(--primary)' }} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.01em', marginBottom: 8 }}>¡Turno confirmado!</h2>
            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              Te enviamos los detalles y el enlace de la videollamada a tu correo.
            </p>

            <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'left' }}>
              {[
                { icon: 'ti-calendar', label: 'Fecha', val: dateLabel(bookingInfo.date) },
                { icon: 'ti-clock', label: 'Horario', val: `${bookingInfo.hour} – ${hourEnd(bookingInfo.hour)}` },
                { icon: 'ti-user', label: 'Profesional', val: bookingInfo.psic },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)', lastChild: { borderBottom: 'none' } }}>
                  <i className={`ti ${row.icon}`} style={{ fontSize: 16, color: 'var(--text3)', width: 20, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{row.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{row.val}</div>
                  </div>
                </div>
              ))}
            </div>

            {meetLink && (
              <a
                href={meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-p btn-full"
                style={{ marginBottom: 10, justifyContent: 'center', display: 'flex', gap: 6 }}
              >
                <i className="ti ti-video" /> Abrir Google Meet
              </a>
            )}

            <Link href="/mis-turnos" className="btn btn-full" style={{ justifyContent: 'center', display: 'flex', gap: 6 }}>
              <i className="ti ti-calendar-check" /> Ver mis turnos
            </Link>

            <Link href="/" style={{ display: 'block', marginTop: 14, fontSize: 12, color: 'var(--text3)' }}>
              Volver al inicio
            </Link>
          </>
        )}

        {status === 'already_done' && (
          <>
            <div style={{ fontSize: 48, marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Turno ya reservado</h2>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              Ese horario ya fue tomado por otro paciente. Por favor elegí otro turno.
            </p>
            <Link href="/" className="btn btn-p btn-full" style={{ justifyContent: 'center', display: 'flex', gap: 6 }}>
              <i className="ti ti-calendar-plus" /> Ver otros turnos
            </Link>
          </>
        )}

        {status === 'no_pending' && (
          <>
            <div style={{ fontSize: 48, marginBottom: '1rem' }}>📅</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Sin turno pendiente</h2>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              No encontramos un turno pendiente de confirmación. Es posible que ya se haya procesado.
            </p>
            <Link href="/mis-turnos" className="btn btn-p btn-full" style={{ justifyContent: 'center', display: 'flex', gap: 6 }}>
              <i className="ti ti-calendar-check" /> Ver mis turnos
            </Link>
            <Link href="/" style={{ display: 'block', marginTop: 10, fontSize: 12, color: 'var(--text3)' }}>
              Reservar un turno nuevo
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: 48, marginBottom: '1rem' }}>❌</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Algo salió mal</h2>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, marginBottom: '1.5rem' }}>{error}</p>
            <Link href="/" className="btn btn-p btn-full" style={{ justifyContent: 'center', display: 'flex', gap: 6 }}>
              <i className="ti ti-refresh" /> Intentar de nuevo
            </Link>
          </>
        )}
      </div>

      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css" />
    </div>
  )
}
