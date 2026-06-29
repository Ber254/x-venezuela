'use client'
import { useState } from 'react'
import type { Booking, Availability, Profile, Role } from '@/types'
import { DAYS_SHORT, MONTHS, mondayOf, addDays, fmtDate, slotsFromShift } from '@/lib/utils'

interface Props {
  role: Role
  psicId?: string
  bookings: Booking[]
  availability: Availability[]
  psics: Profile[]
}

export default function AdminCalendar({ role, psicId, bookings, availability, psics }: Props) {
  const [offset, setOffset] = useState(0)   // weeks offset from "week-1"

  const base  = addDays(mondayOf(new Date()), -7)
  const start = addDays(base, offset * 7)
  const end   = addDays(start, 27)

  const rangeLabel = `${start.getDate()} ${MONTHS[start.getMonth()]} — ${end.getDate()} ${MONTHS[end.getMonth()]} ${end.getFullYear()}`
  const today = fmtDate(new Date())

  const WEEK_LABELS = ['Semana anterior','Semana actual','Próxima semana','En dos semanas']

  function getAvailsForDay(dateStr: string, filterPsicId?: string) {
    const dow = new Date(dateStr + 'T12:00:00').getDay()
    return availability.filter(av => {
      if (filterPsicId && av.psic_id !== filterPsicId) return false
      if (av.valid_from && dateStr < av.valid_from) return false
      if (av.valid_until && dateStr > av.valid_until) return false
      return (av.days as number[]).includes(dow)
    })
  }

  function getBookingsForDay(dateStr: string, forPsicId?: string) {
    return bookings.filter(b => b.date === dateStr && (!forPsicId || b.psic_id === forPsicId))
  }

  return (
    <div>
      <div className="ph" style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>
          {role === 'psic' ? 'Mis disponibilidades' : 'Calendario de disponibilidades'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>
          Semana anterior, actual y próximas dos
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '.875rem' }}>
        {psics.filter(p => !psicId || p.id === psicId).map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text2)' }}>
            <span className="dot" style={{ background: p.color ?? '#ccc' }} />
            {p.full_name.split(' ').slice(-1)[0]}
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '.875rem' }}>
        <button className="btn btn-sm" onClick={() => setOffset(o => o - 1)}>
          <i className="ti ti-chevron-left" />
        </button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 600 }}>{rangeLabel}</div>
        <button className="btn btn-sm" onClick={() => setOffset(o => o + 1)}>
          <i className="ti ti-chevron-right" />
        </button>
      </div>

      {/* 4 weeks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {[0,1,2,3].map(w => {
          const ws = addDays(start, w * 7)
          return (
            <div key={w} className="card" style={{ padding: '1rem' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>
                {WEEK_LABELS[w]} — {ws.getDate()} {MONTHS[ws.getMonth()]} al {addDays(ws,6).getDate()} {MONTHS[addDays(ws,6).getMonth()]}
              </div>
              <div className="calendar">
                {DAYS_SHORT.map(d => <div key={d} className="cal-h">{d}</div>)}
                {[0,1,2,3,4,5,6].map(d => {
                  const date = addDays(ws, d)
                  const ds   = fmtDate(date)
                  const isPast = ds < today
                  const activePsics = psicId
                    ? psics.filter(p => p.id === psicId)
                    : psics.filter(p => p.active !== false)

                  const dayAvails = activePsics.flatMap(p =>
                    getAvailsForDay(ds, p.id).map(av => ({ av, psic: p }))
                  )
                  const dayBookings = getBookingsForDay(ds)

                  return (
                    <div key={d} className={`cal-day${ds === today ? ' today' : ''}${isPast ? ' past' : ''}`}>
                      <div className="cal-dn">
                        {date.getDate()}
                        {ds === today && <span className="today-badge">Hoy</span>}
                      </div>
                      {dayAvails.map(({ av, psic }) => {
                        const totalSlots = (av.shifts as {start:string;end:string}[]).reduce(
                          (s, sh) => s + slotsFromShift(sh.start, sh.end).length, 0
                        )
                        const booked = dayBookings.filter(b => b.psic_id === psic.id).length
                        const startTimes = (av.shifts as {start:string;end:string}[]).map(s => s.start.substring(0,5)).join(' ')
                        return (
                          <div key={av.id} className="ab" style={{ background: psic.color ?? '#ccc', color: '#fff', cursor: 'default' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 58, fontSize: 9 }}>
                              {startTimes}
                            </span>
                            <span style={{ background: 'rgba(255,255,255,.38)', borderRadius: 3, padding: '0 3px', fontSize: 8, fontWeight: 700 }}>
                              {booked}/{totalSlots}
                            </span>
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
    </div>
  )
}
