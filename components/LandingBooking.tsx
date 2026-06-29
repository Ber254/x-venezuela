'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DAYS_FULL, MONTHS, hourEnd } from '@/lib/utils'

interface PsicSlot { id: string; name: string; specialty: string; color: string }
interface Slot     { hour: string; psics: PsicSlot[] }
type SlotsMap = Record<string, Slot[]>

type Step = 'browse' | 'select_psic' | 'enter_email' | 'sent' | 'done'

export default function LandingBooking({ initialSlots }: { initialSlots: SlotsMap }) {
  const [slots]         = useState<SlotsMap>(initialSlots)
  const [step, setStep] = useState<Step>('browse')

  // Selection state
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedHour, setSelectedHour] = useState('')
  const [selectedPsic, setSelectedPsic] = useState<PsicSlot | null>(null)
  const [availPsics, setAvailPsics]     = useState<PsicSlot[]>([])

  // Email form
  const [email, setEmail]   = useState('')
  const [name, setName]     = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const dates = Object.keys(slots).sort()

  function dateLabel(ds: string) {
    const d = new Date(ds + 'T12:00:00')
    return `${DAYS_FULL[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`
  }

  function isToday(ds: string) {
    return ds === new Date().toISOString().split('T')[0]
  }

  function pickSlot(date: string, hour: string, psics: PsicSlot[]) {
    setSelectedDate(date)
    setSelectedHour(hour)
    setAvailPsics(psics)
    setSelectedPsic(psics[0])
    setStep('select_psic')
  }

  async function handleSendLink() {
    setError('')
    if (!email.includes('@')) { setError('Ingresá un correo válido'); return }
    setLoading(true)
    try {
      // Store pending booking in sessionStorage so the callback can complete it
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pending_booking', JSON.stringify({
          date: selectedDate,
          hour: selectedHour,
          psic_id: selectedPsic?.id,
        }))
      }
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${location.origin}/api/auth/callback?next=/confirmar-turno`,
          data: { full_name: name || email.split('@')[0], role: 'user' },
        },
      })
      if (err) throw err
      setStep('sent')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al enviar el correo')
    } finally {
      setLoading(false)
    }
  }

  // ── STEP: BROWSE ──────────────────────────────────────────
  if (step === 'browse') {
    if (!dates.length) {
      return (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text3)' }}>
          <i className="ti ti-calendar-off" style={{ fontSize: 48, display: 'block', marginBottom: 12 }} />
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No hay turnos disponibles por ahora</div>
          <div style={{ fontSize: 13 }}>Volvé pronto — se actualizan frecuentemente.</div>
        </div>
      )
    }

    return (
      <div>
        {dates.map(ds => (
          <div key={ds} style={{ marginBottom: '2rem' }}>
            {/* Day header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                {dateLabel(ds)}
              </div>
              {isToday(ds) && (
                <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--primary)', color: '#fff', borderRadius: 4, padding: '2px 7px', letterSpacing: '.04em' }}>
                  HOY
                </span>
              )}
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>{slots[ds].length} horario{slots[ds].length !== 1 ? 's' : ''}</span>
            </div>

            {/* Slots grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
              {slots[ds].map(({ hour, psics }) => (
                <button
                  key={hour}
                  onClick={() => pickSlot(ds, hour, psics)}
                  style={{
                    background: '#fff',
                    border: '1px solid var(--border2)',
                    borderRadius: 10,
                    padding: '14px 16px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all .15s',
                    fontFamily: "'Inter', sans-serif",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--primary)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.09)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border2)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.01em', color: 'var(--text)', marginBottom: 4 }}>
                    {hour}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>
                    hasta las {hourEnd(hour)}
                  </div>
                  {/* Psic dots */}
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {psics.slice(0, 4).map(p => (
                      <span
                        key={p.id}
                        title={p.name}
                        style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }}
                      />
                    ))}
                    <span style={{ fontSize: 10, color: 'var(--text3)', marginLeft: 2 }}>
                      {psics.length === 1 ? psics[0].name.split(' ')[0] : `${psics.length} profesionales`}
                    </span>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 11, fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Reservar <i className="ti ti-arrow-right" style={{ fontSize: 11 }} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ── STEP: SELECT PSIC ─────────────────────────────────────
  if (step === 'select_psic') {
    const hEnd = hourEnd(selectedHour)
    return (
      <div style={{ maxWidth: 540, margin: '0 auto' }}>
        <button className="btn btn-sm" onClick={() => setStep('browse')} style={{ marginBottom: '1.25rem' }}>
          <i className="ti ti-arrow-left" /> Volver
        </button>

        {/* Resumen del turno */}
        <div style={{ background: 'var(--primary)', color: '#fff', borderRadius: 12, padding: '1.25rem 1.5rem', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: 11, opacity: .7, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Tu turno seleccionado</div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-.02em', lineHeight: 1 }}>{selectedHour} – {hEnd}</div>
          <div style={{ fontSize: 14, opacity: .85, marginTop: 6 }}>{dateLabel(selectedDate)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 12, opacity: .75 }}>
            <i className="ti ti-video" style={{ fontSize: 14 }} />
            Sesión por Google Meet · 1 hora · Gratuita
          </div>
        </div>

        {/* Elegir psicólogo */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>
            Elegí un profesional ({availPsics.length} disponible{availPsics.length !== 1 ? 's' : ''})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {availPsics.map(p => (
              <div
                key={p.id}
                onClick={() => setSelectedPsic(p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px',
                  border: `1.5px solid ${selectedPsic?.id === p.id ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: 10, cursor: 'pointer',
                  background: selectedPsic?.id === p.id ? 'var(--surface2)' : '#fff',
                  transition: '.12s',
                }}
              >
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 15, flexShrink: 0 }}>
                  {p.name.split(' ').map((w: string) => w[0]).join('').substring(0,2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{p.specialty}</div>
                </div>
                {selectedPsic?.id === p.id && (
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="ti ti-check" style={{ fontSize: 12, color: '#fff' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          className="btn btn-p btn-full"
          onClick={() => setStep('enter_email')}
          disabled={!selectedPsic}
        >
          <i className="ti ti-arrow-right" /> Continuar
        </button>
      </div>
    )
  }

  // ── STEP: ENTER EMAIL ─────────────────────────────────────
  if (step === 'enter_email') {
    return (
      <div style={{ maxWidth: 440, margin: '0 auto' }}>
        <button className="btn btn-sm" onClick={() => setStep('select_psic')} style={{ marginBottom: '1.25rem' }}>
          <i className="ti ti-arrow-left" /> Volver
        </button>

        {/* Resumen compacto */}
        <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 16px', marginBottom: '1.25rem', display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: selectedPsic?.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 14, flexShrink: 0 }}>
            {selectedPsic?.name.split(' ').map((w: string) => w[0]).join('').substring(0,2)}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{selectedPsic?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text2)' }}>{dateLabel(selectedDate)} · {selectedHour} – {hourEnd(selectedHour)}</div>
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, letterSpacing: '-.01em' }}>
            ¿A qué correo te enviamos el turno?
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
            Te mandamos un <strong>enlace mágico</strong> para confirmar — sin contraseña, sin registro previo.
          </div>

          <div className="fg">
            <label>Correo electrónico</label>
            <input
              type="email"
              placeholder="tucorreo@ejemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendLink()}
              autoFocus
            />
          </div>
          <div className="fg">
            <label>Tu nombre <span style={{ fontWeight: 400, color: 'var(--text3)', textTransform: 'none' }}>(primera vez)</span></label>
            <input
              type="text"
              placeholder="Nombre y apellido"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendLink()}
            />
          </div>

          {error && <div className="err"><i className="ti ti-alert-circle" /> {error}</div>}

          <button className="btn btn-p btn-full" onClick={handleSendLink} disabled={loading} style={{ marginTop: 4 }}>
            {loading ? 'Enviando…' : <><i className="ti ti-send" /> Enviar enlace de confirmación</>}
          </button>

          <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text3)', textAlign: 'center', lineHeight: 1.6 }}>
            Al confirmar aceptás nuestra política de privacidad.<br />
            Tu sesión es completamente confidencial.
          </div>
        </div>
      </div>
    )
  }

  // ── STEP: SENT ────────────────────────────────────────────
  if (step === 'sent') {
    return (
      <div style={{ maxWidth: 440, margin: '0 auto', textAlign: 'center', padding: '2rem 0' }}>
        <div style={{ width: 72, height: 72, background: 'var(--surface2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <i className="ti ti-mail-check" style={{ fontSize: 34, color: 'var(--primary)' }} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.01em', marginBottom: 8 }}>¡Revisá tu correo!</h2>
        <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
          Enviamos un enlace de confirmación a <strong>{email}</strong>.<br />
          Hacé clic en el enlace para confirmar tu turno — expira en 10 minutos.
        </p>

        <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem', textAlign: 'left' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>Tu turno reservado</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: selectedPsic?.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 13, flexShrink: 0 }}>
              {selectedPsic?.name.split(' ').map((w: string) => w[0]).join('').substring(0,2)}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedHour} – {hourEnd(selectedHour)} · {dateLabel(selectedDate)}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{selectedPsic?.name} · {selectedPsic?.specialty}</div>
            </div>
          </div>
        </div>

        <button className="btn btn-full" onClick={() => { setStep('browse'); setEmail(''); setName('') }}>
          <i className="ti ti-calendar-plus" /> Reservar otro turno
        </button>
      </div>
    )
  }

  return null
}
