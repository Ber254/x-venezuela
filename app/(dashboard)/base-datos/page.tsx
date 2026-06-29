import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function BaseDatosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'superadmin') redirect('/calendario')

  const [patientsRes, psicsRes, bookingsRes, absencesRes] = await Promise.all([
    supabase.from('profiles').select('id,full_name,email,created_at').eq('role','user').order('full_name'),
    supabase.from('profiles').select('id,full_name,email,specialty,color,active').eq('role','psic').order('full_name'),
    supabase.from('bookings').select('id,patient_id,psic_id,date,hour').order('date'),
    supabase.from('absences').select('patient_id').order('date'),
  ])

  const patients  = patientsRes.data  ?? []
  const psics     = psicsRes.data     ?? []
  const bookings  = bookingsRes.data  ?? []
  const absences  = absencesRes.data  ?? []

  const now = new Date().toISOString().split('T')[0]

  function getWeekBounds() {
    const d = new Date(); const day = d.getDay()
    d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
    const from = d.toISOString().split('T')[0]
    const to   = new Date(d.setDate(d.getDate() + 6)).toISOString().split('T')[0]
    return { from, to }
  }
  const { from: wFrom, to: wTo } = getWeekBounds()

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Base de datos</div>
      <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: '1.25rem' }}>Registro completo de usuarios y profesionales</div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: '.875rem' }}>
          <i className="ti ti-users" style={{ marginRight: 5 }} />Pacientes registrados ({patients.length})
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>#</th><th>Nombre</th><th>Correo</th><th>Turnos totales</th><th>Esta semana</th><th>Inasistencias</th></tr></thead>
            <tbody>
              {patients.map((u, i) => {
                const myBooks     = bookings.filter(b => b.patient_id === u.id)
                const thisWeek    = myBooks.filter(b => b.date >= wFrom && b.date <= wTo).length
                const myAbsences  = absences.filter(a => a.patient_id === u.id).length
                return (
                  <tr key={u.id}>
                    <td style={{ color: 'var(--text3)', fontSize: 11 }}>{i+1}</td>
                    <td style={{ fontWeight: 500, fontSize: 12 }}>{u.full_name}</td>
                    <td style={{ color: 'var(--text2)', fontSize: 12 }}>{u.email}</td>
                    <td><span className="pill pill-g">{myBooks.length} turno{myBooks.length !== 1 ? 's' : ''}</span></td>
                    <td><span className={`pill ${thisWeek > 0 ? 'pill-b' : ''}`} style={thisWeek === 0 ? { color: 'var(--text3)', background: 'none' } : {}}>{thisWeek > 0 ? `${thisWeek} esta semana` : 'Sin turnos'}</span></td>
                    <td>
                      {myAbsences > 0
                        ? <span className={`pill ${myAbsences >= 2 ? 'pill-r' : ''}`}>{myAbsences} {myAbsences >= 2 ? '⚠' : ''}</span>
                        : <span style={{ fontSize: 11, color: 'var(--text3)' }}>—</span>}
                    </td>
                  </tr>
                )
              })}
              {!patients.length && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text3)' }}>Sin pacientes registrados</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: '.875rem' }}>
          <i className="ti ti-stethoscope" style={{ marginRight: 5 }} />Psicólogos registrados ({psics.length})
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>#</th><th>Nombre</th><th>Correo</th><th>Especialidad</th><th>Turnos dados</th><th>Estado</th></tr></thead>
            <tbody>
              {psics.map((p, i) => {
                const given = bookings.filter(b => b.psic_id === p.id).length
                return (
                  <tr key={p.id} style={{ opacity: p.active ? 1 : 0.55 }}>
                    <td style={{ color: 'var(--text3)', fontSize: 11 }}>{i+1}</td>
                    <td><span className="dot" style={{ background: p.active ? (p.color ?? '#ccc') : '#B4B2A9' }} /><span style={{ fontSize: 12, fontWeight: 500 }}>{p.full_name}</span></td>
                    <td style={{ color: 'var(--text2)', fontSize: 12 }}>{p.email}</td>
                    <td><span className="pill pill-b">{p.specialty ?? '—'}</span></td>
                    <td><span className="pill pill-g">{given} turno{given !== 1 ? 's' : ''}</span></td>
                    <td><span className={`pill ${p.active ? 'pill-g' : 'pill-r'}`}>{p.active ? 'Activo' : 'Inactivo'}</span></td>
                  </tr>
                )
              })}
              {!psics.length && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text3)' }}>Sin psicólogos</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
