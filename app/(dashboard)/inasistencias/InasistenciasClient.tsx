'use client'
import { useState } from 'react'
import type { Absence } from '@/types'
import { DAYS_FULL, MONTHS } from '@/lib/utils'

interface Booking {
  id: string; date: string; hour: string; patient_id: string
  patient: { full_name: string; email: string }
}

interface Props {
  psicId: string
  bookings: Booking[]
  absences: Absence[]
}

export default function InasistenciasClient({ psicId, bookings, absences: initialAbsences }: Props) {
  const [absences, setAbsences] = useState(initialAbsences)

  function hEnd(h: string) { return String(parseInt(h) + 1).padStart(2, '0') + ':00' }
  function dateLabel(ds: string) {
    const d = new Date(ds + 'T12:00:00')
    return `${DAYS_FULL[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
  }

  function isAbsent(bookingId: string) {
    return absences.find(a => a.booking_id === bookingId)
  }

  async function toggleAbsence(booking: Booking) {
    const existing = isAbsent(booking.id)
    if (existing) {
      await fetch(`/api/absences/${existing.id}`, { method: 'DELETE' })
      setAbsences(a => a.filter(x => x.id !== existing.id))
    } else {
      const res = await fetch('/api/absences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: booking.id }),
      })
      if (res.ok) {
        const data = await res.json()
        setAbsences(a => [data, ...a])
      } else {
        const d = await res.json()
        alert(d.error)
      }
    }
  }

  // Count absences per patient
  const patientCounts: Record<string, number> = {}
  absences.forEach(a => { patientCounts[a.patient_id] = (patientCounts[a.patient_id] ?? 0) + 1 })
  const flagged = Object.entries(patientCounts).filter(([,c]) => c >= 2)

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Inasistencias</div>
      <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: '1.25rem' }}>Marcá cuando un paciente no se presentó a su turno</div>

      {flagged.length > 0 && (
        <div style={{ background: '#FCEBEB', border: '.5px solid #F09595', borderRadius: 10, padding: '10px 14px', marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <i className="ti ti-alert-triangle" style={{ fontSize: 18, color: '#E24B4A', flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#A32D2D', marginBottom: 3 }}>
              {flagged.length} paciente{flagged.length !== 1 ? 's tienen' : ' tiene'} 2 o más inasistencias
            </div>
            <div style={{ fontSize: 11, color: '#793535' }}>
              {flagged.map(([uid, cnt]) => {
                const abs = absences.find(a => a.patient_id === uid)
                return abs ? `${abs.patient_name} — ${cnt} inasistencias` : ''
              }).join(' · ')}
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: '.875rem', display: 'flex', alignItems: 'center', gap: 5 }}>
          <i className="ti ti-calendar-x" /> Turnos pasados — marcar inasistencia
        </div>
        {!bookings.length && <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text3)', fontSize: 13 }}>No hay turnos pasados en los últimos 30 días</div>}
        {bookings.map(b => {
          const absent = isAbsent(b.id)
          const cnt    = patientCounts[b.patient_id] ?? 0
          return (
            <div key={b.id} style={{
              background: 'var(--surface)', border: `0.5px solid ${absent ? '#F09595' : 'var(--border)'}`,
              borderRadius: 12, padding: '.875rem 1.1rem', marginBottom: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
              background: absent ? '#FCEBEB' : 'var(--surface)',
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{dateLabel(b.date)}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: absent ? '#A32D2D' : 'var(--green)', margin: '2px 0' }}>{b.hour} – {hEnd(b.hour)}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                  <i className="ti ti-user" style={{ marginRight: 3 }} />{b.patient.full_name} · {b.patient.email}
                  {cnt >= 2 && <span style={{ marginLeft: 8, color: '#A32D2D', fontWeight: 600 }}>⚠ {cnt}x reincidente</span>}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <span className={`pill ${absent ? 'pill-r' : 'pill-g'}`}>
                  {absent ? '✗ No se presentó' : '✓ Asistió'}
                </span>
                <button
                  className={`btn btn-sm${absent ? ' btn-red' : ''}`}
                  style={absent ? {} : { borderColor: '#F09595', color: '#A32D2D' }}
                  onClick={() => toggleAbsence(b)}
                >
                  {absent
                    ? <><i className="ti ti-rotate-clockwise" /> Deshacer</>
                    : <><i className="ti ti-user-x" /> Marcar inasistencia</>}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {absences.length > 0 && (
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: '.875rem', display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className="ti ti-history" /> Historial de inasistencias registradas
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.75rem', marginBottom: '1rem' }}>
            <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '.875rem 1rem' }}>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>Total registradas</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#E24B4A' }}>{absences.length}</div>
            </div>
            <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '.875rem 1rem' }}>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>Pacientes únicos</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{Object.keys(patientCounts).length}</div>
            </div>
            <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '.875rem 1rem' }}>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>Reincidentes (2+)</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#BA7517' }}>{flagged.length}</div>
            </div>
          </div>
          {absences.map(a => (
            <div key={a.id} style={{ background: '#FCEBEB', border: '.5px solid #F09595', borderRadius: 12, padding: '.875rem 1.1rem', marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{dateLabel(a.date)}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#A32D2D', margin: '2px 0' }}>{a.hour} – {hEnd(a.hour)}</div>
              <div style={{ fontSize: 11, color: '#793535' }}>{a.patient_name} · {a.patient_email}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
