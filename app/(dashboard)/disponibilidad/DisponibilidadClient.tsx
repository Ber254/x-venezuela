'use client'
import { useState } from 'react'
import { DAYS_SHORT } from '@/lib/utils'

interface Shift { start: string; end: string }
interface Avail { id: string; psic_id: string; days: number[]; shifts: Shift[]; valid_from: string; valid_until: string; profile?: { id: string; full_name: string; color: string } }
interface Psic  { id: string; full_name: string }

const EMPTY_FORM = { psic_id: '', days: [] as number[], shifts: [{ start: '09:00', end: '12:00' }] as Shift[], valid_from: '', valid_until: '' }

export default function DisponibilidadClient({ availability: initial, psics }: { availability: Avail[]; psics: Psic[] }) {
  const [avails, setAvails]     = useState(initial)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId]     = useState<string | null>(null)
  const [form, setForm]         = useState({ ...EMPTY_FORM, psic_id: psics[0]?.id ?? '' })
  const [error, setError]       = useState('')

  function openNew() {
    const today = new Date().toISOString().split('T')[0]
    const until = new Date(); until.setDate(until.getDate() + 60)
    setForm({ ...EMPTY_FORM, psic_id: psics[0]?.id ?? '', valid_from: today, valid_until: until.toISOString().split('T')[0] })
    setEditId(null); setShowModal(true); setError('')
  }

  function openEdit(av: Avail) {
    setForm({ psic_id: av.psic_id, days: [...av.days], shifts: av.shifts.map(s => ({ ...s })), valid_from: av.valid_from, valid_until: av.valid_until })
    setEditId(av.id); setShowModal(true); setError('')
  }

  function toggleDay(d: number) {
    setForm(f => ({ ...f, days: f.days.includes(d) ? f.days.filter(x => x !== d) : [...f.days, d] }))
  }

  function updateShift(i: number, field: 'start'|'end', val: string) {
    setForm(f => { const shifts = [...f.shifts]; shifts[i] = { ...shifts[i], [field]: val }; return { ...f, shifts } })
  }

  async function save() {
    setError('')
    const url    = editId ? `/api/availability/${editId}` : '/api/availability'
    const method = editId ? 'PATCH' : 'POST'
    const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (!res.ok) { const d = await res.json(); setError(d.error?.toString() ?? 'Error'); return }
    const data = await res.json()
    setAvails(a => editId ? a.map(x => x.id === editId ? { ...data, profile: psics.find(p => p.id === data.psic_id) } : x) : [...a, { ...data, profile: psics.find(p => p.id === data.psic_id) }])
    setShowModal(false)
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar esta disponibilidad?')) return
    await fetch(`/api/availability/${id}`, { method: 'DELETE' })
    setAvails(a => a.filter(x => x.id !== id))
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Disponibilidad</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>Franjas horarias por psicólogo</div>
        </div>
        <button className="btn btn-p" onClick={openNew}><i className="ti ti-plus" /> Nueva disponibilidad</button>
      </div>

      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Psicólogo</th><th>Días</th><th>Turnos</th><th>Vigencia</th><th /></tr></thead>
            <tbody>
              {avails.map(av => {
                const p = av.profile
                return (
                  <tr key={av.id}>
                    <td><span className="dot" style={{ background: p?.color ?? '#ccc' }} />{p?.full_name ?? av.psic_id}</td>
                    <td style={{ fontSize: 11 }}>{av.days.sort((a,b)=>a-b).map(d => DAYS_SHORT[d]).join(', ')}</td>
                    <td style={{ fontSize: 11 }}>{av.shifts.map(s => `${s.start}–${s.end}`).join(' | ')}</td>
                    <td style={{ fontSize: 11 }}>{av.valid_from} → {av.valid_until}</td>
                    <td style={{ display: 'flex', gap: 5 }}>
                      <button className="btn btn-sm" onClick={() => openEdit(av)}><i className="ti ti-edit" style={{ color: '#378ADD' }} /></button>
                      <button className="btn btn-sm" onClick={() => remove(av.id)}><i className="ti ti-trash" style={{ color: '#E24B4A' }} /></button>
                    </td>
                  </tr>
                )
              })}
              {!avails.length && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text3)' }}>Sin disponibilidades configuradas</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-bg open">
          <div className="modal">
            <div className="modal-t">
              {editId ? 'Editar disponibilidad' : 'Nueva disponibilidad'}
              <span className="modal-x" onClick={() => setShowModal(false)}><i className="ti ti-x" /></span>
            </div>
            <div className="fg"><label>Psicólogo</label>
              <select value={form.psic_id} onChange={e => setForm(f => ({ ...f, psic_id: e.target.value }))}>
                {psics.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>Días de la semana</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 12 }}>
              {DAYS_SHORT.map((d, i) => (
                <label key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.days.includes(i)} onChange={() => toggleDay(i)} style={{ display: 'none' }} />
                  <span style={{ fontSize: 9, color: 'var(--text2)', fontWeight: 600 }}>{d}</span>
                  <span style={{ width: 28, height: 28, borderRadius: 6, border: '0.5px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, background: form.days.includes(i) ? 'var(--green)' : 'transparent', color: form.days.includes(i) ? '#fff' : 'var(--text2)' }}>{d.charAt(0)}</span>
                </label>
              ))}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>Turnos del día</div>
            {form.shifts.map((sh, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, padding: 8, background: 'var(--surface2)', borderRadius: 8 }}>
                <label style={{ fontSize: 11, color: 'var(--text2)', minWidth: 30, fontWeight: 600 }}>Inicio</label>
                <input type="time" value={sh.start} onChange={e => updateShift(i,'start',e.target.value)} style={{ padding: '4px 8px', border: '0.5px solid var(--border2)', borderRadius: 6, fontSize: 12, background: 'var(--surface)', color: 'var(--text)' }} />
                <label style={{ fontSize: 11, color: 'var(--text2)', minWidth: 20, fontWeight: 600 }}>Fin</label>
                <input type="time" value={sh.end} onChange={e => updateShift(i,'end',e.target.value)} style={{ padding: '4px 8px', border: '0.5px solid var(--border2)', borderRadius: 6, fontSize: 12, background: 'var(--surface)', color: 'var(--text)' }} />
                {form.shifts.length > 1 && (
                  <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#E24B4A', fontSize: 15 }} onClick={() => setForm(f => ({ ...f, shifts: f.shifts.filter((_,j) => j !== i) }))}>
                    <i className="ti ti-x" />
                  </button>
                )}
              </div>
            ))}
            <button className="btn btn-sm" style={{ marginBottom: '1rem' }} onClick={() => setForm(f => ({ ...f, shifts: [...f.shifts, { start: '14:00', end: '17:00' }] }))}>
              <i className="ti ti-plus" /> Agregar franja
            </button>
            <div className="fr">
              <div className="fg" style={{ flex: 1 }}><label>Vigencia desde</label>
                <input type="date" value={form.valid_from} onChange={e => setForm(f => ({ ...f, valid_from: e.target.value }))} />
              </div>
              <div className="fg" style={{ flex: 1 }}><label>Vigencia hasta</label>
                <input type="date" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} />
              </div>
            </div>
            {error && <div className="err">{error}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-p" onClick={save}><i className="ti ti-check" /> Guardar disponibilidad</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
