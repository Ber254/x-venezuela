'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Profile, Availability, Booking } from '@/types'
import { DAYS_SHORT, DAYS_FULL, MONTHS, mondayOf, addDays, fmtDate, slotsFromShift, hourEnd, formatDateLabel } from '@/lib/utils'

interface Props {
  profile: Profile
  psics: Profile[]
  availability: Availability[]
  bookings: Booking[]
  weekUsed: number
}

type View = 'panel' | 'calendario' | 'confirmando' | 'confirmado'

export default function ReservarClient({ profile, psics, availability, bookings: initialBookings, weekUsed: initialWeekUsed }: Props) {
  const [bookings, setBookings]     = useState(initialBookings)
  const [weekUsed, setWeekUsed]     = useState(initialWeekUsed)
  const [psicFilter, setPsicFilter] = useState<string | null>(null)
  const [view, setView]             = useState<View>('panel')
  const [calOffset, setCalOffset]   = useState(0)
  const [pending, setPending]       = useState<{ date: string; hour: string; avail: Profile[] } | null>(null)
  const [selectedPsic, setSelectedPsic] = useState<string | null>(null)
  const [confirmed, setConfirmed]   = useState<Booking | null>(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const router = useRouter()

  const today = fmtDate(new Date())
  const mon   = mondayOf(new Date())

  function getAvailsForDay(dateStr: string, psicId?: string) {
    const dow = new Date(dateStr + 'T12:00:00').getDay()
    return availability.filter(av => {
      if (psicId && av.psic_id !== psicId) return false
      if (av.valid_from && dateStr < av.valid_from) return false
      if (av.valid_until && dateStr > av.valid_until) return false
      return (av.days as number[]).includes(dow)
    })
  }

  function getFreeSlots(dateStr: string, psicId: string | null): { hour: string; psics: Profile[] }[] {
    const activePsics = psics.filter(p => !psicId || p.id === psicId)
    const slotMap: Record<string, Profile[]> = {}
    activePsics.forEach(p => {
      getAvailsForDay(dateStr, p.id).forEach(av => {
        (av.shifts as {start:string;end:string}[]).forEach(sh => {
          slotsFromShift(sh.start, sh.end).forEach(h => {
            const taken = bookings.find(b => b.date === dateStr && b.psic_id === p.id && b.hour === h)
            if (!taken) {
              if (!slotMap[h]) slotMap[h] = []
              slotMap[h].push(p)
            }
          })
        })
      })
    })
    return Object.entries(slotMap).sort().map(([hour, psics]) => ({ hour, psics }))
  }

  function isMyBooking(dateStr: string, hour: string) {
    return bookings.find(b => b.date === dateStr && b.hour === hour && b.patient_id === profile.id)
  }

  function countAvailableThisWeek() {
    let count = 0
    for (let i = 0; i < 7; i++) {
      const ds = fmtDate(addDays(mon, i))
      if (ds < today) continue
      count += getFreeSlots(ds, null).length
    }
    return count
  }

  async function confirmBook() {
    if (!pending || !selectedPsic) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: pending.date, hour: pending.hour, psic_id: selectedPsic }),
      })
      if (!res.ok) {
        const d = await res.json(); throw new Error(d.error)
      }
      const booking = await res.json()
      setBookings(b => [...b, booking])
      setWeekUsed(w => w + 1)
      setConfirmed(booking)
      setView('confirmado')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al confirmar')
    } finally {
      setLoading(false)
    }
  }

  async function cancelBooking(id: string) {
    if (!confirm('¿Cancelar este turno?')) return
    await fetch(`/api/bookings/${id}`, { method: 'DELETE' })
    setBookings(b => b.filter(x => x.id !== id))
    setWeekUsed(w => Math.max(0, w - 1))
    router.refresh()
  }

  // ── Panel ──
  if (view === 'panel') return (
    <div>
      <div style={{ background: 'linear-gradient(135deg,#1D9E75 0%,#0F6E56 100%)', borderRadius: 14, padding: '1.5rem 1.75rem', color: '#fff', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 5 }}>
          <i className="ti ti-heart" style={{ marginRight: 6 }} />Mi panel de atención
        </h2>
        <p style={{ fontSize: 12, opacity: .88, lineHeight: 1.5 }}>Reservá turnos con profesionales. Tenés hasta 3 turnos por semana.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard icon="ti-calendar-plus" bg="#E1F5EE" color="#0F6E56" num={countAvailableThisWeek()} label="Turnos libres esta semana" action="Reservar turno" onClick={() => setView('calendario')} />
        <StatCard icon="ti-calendar-check" bg="#E6F1FB" color="#0C447C" num={weekUsed} label={`Mis turnos esta semana (máx. 3)`} action="Ver y gestionar" onClick={() => setView('calendario')} />
        <StatCard icon="ti-history" bg="#FAEEDA" color="#633806" num={bookings.filter(b=>b.patient_id===profile.id).length} label="Total de mis turnos" action="Ver historial" onClick={() => setView('calendario')} />
      </div>
    </div>
  )

  // ── Calendario ──
  if (view === 'calendario') {
    const start = addDays(mon, calOffset * 7)
    const rangeLabel = `${start.getDate()} ${MONTHS[start.getMonth()]} — ${addDays(start,13).getDate()} ${MONTHS[addDays(start,13).getMonth()]} ${addDays(start,13).getFullYear()}`
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <button className="btn btn-sm" onClick={() => setView('panel')} style={{ marginBottom: '.5rem' }}><i className="ti ti-arrow-left" /> Mi panel</button>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Reservar turno</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Elegí un horario disponible</div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, background: weekUsed >= 3 ? '#FCEBEB' : 'var(--green-light)', color: weekUsed >= 3 ? '#A32D2D' : 'var(--green-text)', padding: '3px 10px', borderRadius: 20 }}>
            {weekUsed}/3 turnos esta semana
          </span>
        </div>

        {/* Psic filter */}
        <div className="card" style={{ marginBottom: '.875rem' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>Filtrar por profesional</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button className={`btn btn-sm${psicFilter === null ? ' btn-p' : ''}`} onClick={() => setPsicFilter(null)}>Todos</button>
            {psics.map(p => (
              <button key={p.id} className="btn btn-sm" onClick={() => setPsicFilter(p.id)}
                style={psicFilter === p.id ? { background: p.color, borderColor: p.color, color: '#fff' } : {}}>
                <span className="dot" style={{ background: p.color ?? '#ccc' }} />
                {p.full_name.split(' ').slice(-1)[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '.875rem' }}>
          <button className="btn btn-sm" onClick={() => setCalOffset(o => Math.max(0, o - 1))}><i className="ti ti-chevron-left" /></button>
          <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 600 }}>{rangeLabel}</div>
          <button className="btn btn-sm" onClick={() => setCalOffset(o => o + 1)}><i className="ti ti-chevron-right" /></button>
        </div>

        {[0,1].map(w => {
          const ws = addDays(start, w * 7)
          return (
            <div key={w} className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>
                {w === 0 ? 'Esta semana' : 'Próxima semana'} — {ws.getDate()} {MONTHS[ws.getMonth()]} al {addDays(ws,6).getDate()} {MONTHS[addDays(ws,6).getMonth()]}
              </div>
              <div className="calendar">
                {DAYS_SHORT.map(d => <div key={d} className="cal-h">{d}</div>)}
                {[0,1,2,3,4,5,6].map(d => {
                  const date = addDays(ws, d); const ds = fmtDate(date)
                  const isPast = ds < today
                  const freeSlots = getFreeSlots(ds, psicFilter)
                  const myBook = isMyBooking(ds, '')  // placeholder

                  return (
                    <div key={d} className={`cal-day${ds === today ? ' today' : ''}${isPast ? ' past' : ''}`}>
                      <div className="cal-dn">
                        {date.getDate()}
                        {ds === today && <span className="today-badge">Hoy</span>}
                      </div>
                      {!isPast && freeSlots.slice(0,4).map(({ hour, psics: available }) => {
                        const mine = bookings.find(b => b.date === ds && b.hour === hour && b.patient_id === profile.id)
                        return (
                          <div key={hour} className="ab"
                            style={{
                              background: mine ? 'var(--green)' : 'var(--surface2)',
                              border: '0.5px solid var(--border)',
                              color: mine ? '#fff' : 'var(--text)',
                              cursor: mine ? 'default' : 'pointer',
                            }}
                            onClick={() => {
                              if (mine) return
                              if (weekUsed >= 3) { alert('Límite semanal de 3 turnos alcanzado'); return }
                              setPending({ date: ds, hour, avail: available })
                              setSelectedPsic(available[0]?.id ?? null)
                              setView('confirmando')
                            }}
                          >
                            <span style={{ fontSize: 9, fontWeight: 600 }}>{hour}</span>
                            <span style={{ fontSize: 9 }}>{mine ? '✓ Mío' : 'Libre'}</span>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ── Confirmando ──
  if (view === 'confirmando' && pending) {
    const d   = new Date(pending.date + 'T12:00:00')
    const hEnd = hourEnd(pending.hour)
    return (
      <div>
        <div style={{ marginBottom: '1.25rem' }}>
          <button className="btn btn-sm" onClick={() => setView('calendario')} style={{ marginBottom: '.75rem' }}><i className="ti ti-arrow-left" /> Volver</button>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Confirmá tu turno</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>Revisá los detalles antes de confirmar</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div className="card">
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '.75rem' }}>Tu turno</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--green)', lineHeight: 1 }}>{pending.hour} – {hEnd}</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>{DAYS_FULL[d.getDay()]} {d.getDate()} de {MONTHS[d.getMonth()]}</div>
          </div>
          <div className="card">
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '.75rem' }}>Tu información</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{profile.full_name}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>{profile.email}</div>
            <div style={{ marginTop: 12, padding: '8px 10px', background: '#E1F5EE', borderRadius: 8, fontSize: 11, color: '#085041' }}>
              <i className="ti ti-video" style={{ marginRight: 4 }} />Se creará un Google Meet automáticamente
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '.875rem' }}>
            Elegí un profesional ({pending.avail.length} disponible{pending.avail.length !== 1 ? 's' : ''})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pending.avail.map(p => (
              <div key={p.id}
                onClick={() => setSelectedPsic(p.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '.875rem 1rem', border: `0.5px solid ${selectedPsic === p.id ? 'var(--green)' : 'var(--border)'}`,
                  borderRadius: 10, cursor: 'pointer',
                  background: selectedPsic === p.id ? 'var(--green-light)' : 'var(--surface)',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: p.color ?? '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 14 }}>
                    {p.full_name.split(' ').map(w => w[0]).join('').substring(0,2)}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{p.full_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>{p.specialty}</div>
                  </div>
                </div>
                {selectedPsic === p.id && (
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="ti ti-check" style={{ fontSize: 12, color: '#fff' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && <div className="err">{error}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn" onClick={() => setView('calendario')}>Volver</button>
          <button className="btn btn-p" onClick={confirmBook} disabled={loading || !selectedPsic}>
            {loading ? 'Confirmando…' : <><i className="ti ti-calendar-check" /> Confirmar turno</>}
          </button>
        </div>
      </div>
    )
  }

  // ── Confirmado ──
  if (view === 'confirmado' && confirmed) {
    const psic = psics.find(p => p.id === confirmed.psic_id)
    return (
      <div style={{ maxWidth: 520, margin: '3rem auto', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, background: 'var(--green-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <i className="ti ti-circle-check" style={{ fontSize: 32, color: 'var(--green)' }} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>¡Turno confirmado!</h2>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: '1.75rem' }}>Tu reserva fue registrada con éxito.</p>

        <div className="card" style={{ textAlign: 'left', marginBottom: '1rem' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--green)' }}>{confirmed.hour} – {hourEnd(confirmed.hour)}</div>
          <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>{formatDateLabel(confirmed.date)}</div>
          {psic && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{psic.full_name} · {psic.specialty}</div>}
          {confirmed.meet_link && (
            <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--green-light)', borderRadius: 8 }}>
              <i className="ti ti-video" style={{ marginRight: 6, color: 'var(--green)' }} />
              <a href={confirmed.meet_link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--green)', fontWeight: 600, fontSize: 13 }}>
                Unirse por Google Meet
              </a>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn" onClick={() => setView('panel')}>Mi panel</button>
          <button className="btn btn-p" onClick={() => setView('calendario')}>
            <i className="ti ti-plus" /> Otro turno
          </button>
        </div>
      </div>
    )
  }

  return null
}

function StatCard({ icon, bg, color, num, label, action, onClick }: {
  icon: string; bg: string; color: string; num: number; label: string; action: string; onClick: () => void
}) {
  return (
    <div onClick={onClick} style={{
      background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 14, padding: '1.25rem',
      cursor: 'pointer', transition: 'all .18s', display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className={`ti ${icon}`} style={{ fontSize: 20, color }} />
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{num}</div>
      <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.3 }}>{label}</div>
      <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
        {action} <i className="ti ti-arrow-right" />
      </div>
    </div>
  )
}
