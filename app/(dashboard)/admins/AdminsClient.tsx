'use client'
import { useState } from 'react'

interface Admin { id: string; full_name: string; email: string; active: boolean }

export default function AdminsClient({ admins: initial }: { admins: Admin[] }) {
  const [admins, setAdmins]   = useState(initial)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]       = useState({ full_name: '', email: '', password: '' })
  const [error, setError]     = useState('')

  async function createAdmin() {
    setError('')
    const res = await fetch('/api/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!res.ok) { const d = await res.json(); setError(d.error?.toString() ?? 'Error'); return }
    const admin = await res.json()
    setAdmins(a => [...a, admin])
    setShowModal(false)
    setForm({ full_name: '', email: '', password: '' })
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Administradores</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>Solo el SuperAdmin puede gestionar admins</div>
        </div>
        <button className="btn btn-p" onClick={() => setShowModal(true)}>
          <i className="ti ti-plus" /> Nuevo admin
        </button>
      </div>

      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Nombre</th><th>Correo</th><th>Estado</th></tr></thead>
            <tbody>
              {admins.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 500 }}>{a.full_name}</td>
                  <td style={{ color: 'var(--text2)' }}>{a.email}</td>
                  <td><span className="pill pill-g">Activo</span></td>
                </tr>
              ))}
              {!admins.length && <tr><td colSpan={3} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text3)' }}>No hay administradores</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-bg open">
          <div className="modal">
            <div className="modal-t">
              Nuevo administrador
              <span className="modal-x" onClick={() => setShowModal(false)}><i className="ti ti-x" /></span>
            </div>
            <div className="fg"><label>Nombre completo</label>
              <input type="text" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div className="fr">
              <div className="fg" style={{ flex: 1 }}><label>Correo</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="fg" style={{ flex: 1 }}><label>Contraseña (mín. 8 car.)</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
            </div>
            {error && <div className="err">{error}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-p" onClick={createAdmin}>
                <i className="ti ti-check" /> Crear administrador
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
