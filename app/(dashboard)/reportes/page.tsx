import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MONTHS, DAYS_SHORT } from '@/lib/utils'

export default async function ReportesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'superadmin') redirect('/calendario')

  const now   = new Date()
  const mon   = new Date(now); mon.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1)); mon.setHours(0,0,0,0)
  const sun   = new Date(mon); sun.setDate(mon.getDate() + 6)
  const from  = mon.toISOString().split('T')[0]
  const to    = sun.toISOString().split('T')[0]

  const [bookingsRes, psicsRes] = await Promise.all([
    supabase.from('bookings')
      .select('id,date,hour,psic_id,patient_id,patient:profiles!patient_id(full_name,email)')
      .gte('date', from).lte('date', to),
    supabase.from('profiles').select('id,full_name,color').eq('role','psic'),
  ])

  const bookings = bookingsRes.data ?? []
  const psics    = psicsRes.data ?? []
  const unique   = new Set(bookings.map(b => b.patient_id)).size

  function hEnd(h: string) { return String(parseInt(h) + 1).padStart(2, '0') + ':00' }

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Reportes</div>
      <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: '1.25rem' }}>Semana actual: {from} → {to}</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
        {[
          { lbl: 'Turnos tomados', val: bookings.length, color: 'var(--green)' },
          { lbl: 'Personas atendidas', val: unique, color: 'var(--text)' },
          { lbl: 'Promedio por psic', val: psics.length ? (bookings.length / psics.length).toFixed(1) : 0, color: 'var(--text)' },
        ].map(({ lbl, val, color }) => (
          <div key={lbl} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '.875rem 1rem' }}>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>{lbl}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color }}>{val}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: '.875rem' }}>
          <i className="ti ti-chart-bar" style={{ marginRight: 5 }} />Turnos por psicólogo
        </div>
        {psics.map(p => {
          const count = bookings.filter(b => b.psic_id === p.id).length
          const max   = Math.max(...psics.map(px => bookings.filter(b => b.psic_id === px.id).length), 1)
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 140, fontSize: 12, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>
                <span className="dot" style={{ background: p.color ?? '#ccc' }} />{p.full_name.split(' ').slice(-1)[0]}
              </div>
              <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: 4, height: 22, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.round(count / max * 100)}%`, background: p.color ?? 'var(--green)', borderRadius: 4, display: 'flex', alignItems: 'center', paddingLeft: 8, minWidth: count > 0 ? 28 : 0 }}>
                  {count > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{count}</span>}
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', minWidth: 60, textAlign: 'right' }}>{count} turno{count !== 1 ? 's' : ''}</div>
            </div>
          )
        })}
      </div>

      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: '.875rem' }}>
          <i className="ti ti-users" style={{ marginRight: 5 }} />Detalle de turnos
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Fecha</th><th>Horario</th><th>Psicólogo</th><th>Usuario</th></tr></thead>
            <tbody>
              {!bookings.length && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text3)' }}>Sin turnos en este período</td></tr>
              )}
              {bookings.sort((a,b) => a.date === b.date ? a.hour.localeCompare(b.hour) : a.date.localeCompare(b.date)).map(b => {
                const d    = new Date(b.date + 'T12:00:00')
                const psic = psics.find(p => p.id === b.psic_id)
                const pat  = b.patient as { full_name: string; email: string }
                return (
                  <tr key={b.id}>
                    <td style={{ fontSize: 12 }}>{DAYS_SHORT[d.getDay()]} {d.getDate()} {MONTHS[d.getMonth()].substring(0,3)}</td>
                    <td style={{ fontSize: 12, fontWeight: 600 }}>{b.hour} – {hEnd(b.hour)}</td>
                    <td><span className="dot" style={{ background: psic?.color ?? '#ccc' }} /><span style={{ fontSize: 12 }}>{psic?.full_name ?? '—'}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text2)' }}>{pat?.full_name} · {pat?.email}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
