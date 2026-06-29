'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types'

interface Props {
  psics: Profile[]
  availability: { psic_id: string }[]
}

export default function PsicologosClient({ psics: initial, availability }: Props) {
  const [psics, setPsics] = useState(initial)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]   = useState({ full_name: '', email: '', password: '', specialty: 'Trauma y crisis' })
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const SPECIALTIES = ['Trauma y crisis','Psicología clínica','Psicología infantil','Ansiedad y depresión','Intervención en emergencias']

  async function createPsic() {
    setError('')
    const res = await fetch('/api/psychologists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error?.toString() ?? 'Error')
      return
    }
    const psic = await res.json()
    setPsics(p => [...p, psic])
    setShowModal(false)
    setForm({ full_name: '', email: '', password: '', specialty: 'Trauma y crisis' })
  }

  async function toggleActive(psic: Profile) {
    startTransition(async () => {
      await fetch(`/api/psychologists/${psic.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !psic.active }),
      })
      router.refresh()
    })
  }

  async function deletePsic(id: string) {
    if (!confirm('¿Eliminar este psicólogo y todos sus datos?')) return
    await fetch(`/api/psychologists/${id}`, { method: 'DELETE' })
    setPsics(p => p.filter(x => x.id !== id))
  }

  const avCount = (id: string) => availability.filter(a => a.psic_id === id).length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Psicólogos</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>Profesionales registrados</div>
        </div>
        <button className="btn btn-p" onClick={() => setShowModal(true)}>
          <i className="ti ti-plus" /> Nuevo psicólogo
        </button>
      </div>

      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr><th>Nombre</th><th>Correo</th><th>Especialidad</th><th>Disponibilidades</th><th>Estado</th><th /></tr>
            </thead>
            <tbody>
              {psics.map(p => (
                <tr key={p.id} style={{ opacity: p.active ? 1 : 0.55 }}>
                  <td><span className="dot" style={{ background: p.active ? (p.color ?? '#ccc') : '#B4B2A9' }} />{p.full_name}</td>
                  <td style={{ color: 'var(--text2)' }}>{p.email}</td>
                  <td><span className="pill pill-b">{p.specialty ?? '—'}</span></td>
                  <td><span className="pill pill-g">{avCount(p.id)} config.</span></td>
                  <td>
                    <span className={`pill ${p.active ? 'pill-g' : 'pill-r'}`}>
                      {p.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: 5 }}>
                    <button className="btn btn-sm" onClick={() => toggleActive(p)} disabled={isPending}>
                      <i className={`ti ${p.active ? 'ti-player-pause' : 'ti-player-play'}`} style={{ color: p.active ? '#A32D2D' : '#085041' }} />
                    </button>
                    <button className="btn btn-sm" onClick={() => deletePsic(p.id)}>
                      <i className="ti ti-trash" style={{ color: '#E24B4A' }} />
                    </button>
                  </td>
                </tr>
              ))}
              {!psics.length && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text3)' }}>
                  No hay psicólogos registrados
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-bg open">
          <div className="modal">
            <div className="modal-t">
              Nuevo psicólogo
              <span className="modal-x" onClick={() => setShowModal(false)}><i className="ti ti-x" /></span>
            </div>
            <div className="fg"><label>Nombre completo</label>
              <input type="text" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Dra. María Pérez" />
            </div>
            <div className="fr">
              <div className="fg" style={{ flex: 1 }}><label>Correo</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="fg" style={{ flex: 1 }}><label>Contraseña (mín. 8 car.)</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
            </div>
            <div className="fg"><label>Especialidad</label>
              <select value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}>
                {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            {error && <div className="err">{error}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-p" onClick={createPsic}>
                <i className="ti ti-check" /> Crear psicólogo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
