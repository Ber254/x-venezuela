import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DAYS_FULL, MONTHS } from '@/lib/utils'

export default async function MisTurnosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'user') redirect('/calendario')

  const today = new Date().toISOString().split('T')[0]

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, psic:profiles!psic_id(full_name,specialty,color,email)')
    .eq('patient_id', user.id)
    .order('date').order('hour')

  const upcoming = (bookings ?? []).filter(b => b.date >= today)
  const past     = (bookings ?? []).filter(b => b.date <  today).reverse()

  function hEnd(h: string) { return String(parseInt(h) + 1).padStart(2, '0') + ':00' }
  function dateLabel(ds: string) {
    const d = new Date(ds + 'T12:00:00')
    return `${DAYS_FULL[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`
  }

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Mis turnos</div>
      <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: '1.25rem' }}>Próximos y pasados</div>

      {upcoming.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 8 }}>Próximos</div>
          {upcoming.map(b => {
            const psic = b.psic as { full_name: string; specialty: string; color: string }
            return (
              <div key={b.id} style={{ background: 'var(--green-light)', border: '0.5px solid #9FE1CB', borderRadius: 10, padding: '12px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green-text)' }}>
                    <i className="ti ti-calendar-check" style={{ marginRight: 5 }} />{dateLabel(b.date)} · {b.hour} – {hEnd(b.hour)}
                  </div>
                  <div style={{ fontSize: 11, color: '#0F6E56', marginTop: 2 }}>
                    <span className="dot" style={{ background: psic?.color ?? '#ccc' }} />{psic?.full_name} · {psic?.specialty}
                  </div>
                  {b.meet_link && (
                    <a href={b.meet_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600, marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <i className="ti ti-video" /> Unirse al Meet
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </>
      )}

      {past.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', margin: '1.25rem 0 8px' }}>Historial</div>
          {past.map(b => {
            const psic = b.psic as { full_name: string; specialty: string; color: string }
            return (
              <div key={b.id} style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '10px 14px', marginBottom: 6, opacity: .65 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{dateLabel(b.date)} · {b.hour} – {hEnd(b.hour)}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
                  <span className="dot" style={{ background: psic?.color ?? '#ccc' }} />{psic?.full_name}
                </div>
              </div>
            )
          })}
        </>
      )}

      {!upcoming.length && !past.length && (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text3)' }}>
          <i className="ti ti-calendar-off" style={{ fontSize: 36, display: 'block', marginBottom: 10 }} />
          Todavía no tenés turnos reservados.
        </div>
      )}
    </div>
  )
}
