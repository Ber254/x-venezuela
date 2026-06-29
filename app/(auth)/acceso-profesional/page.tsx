'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AccesoProfesionalPage() {
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) throw err
      router.push('/calendario')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-box"><i className="ti ti-heart-handshake" /></div>
          <div>
            <div className="appname">X <span style={{ color: 'var(--green)' }}>Venezuela</span></div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>Panel de gestión</div>
          </div>
        </div>

        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Acceso profesional</div>
        <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: '1rem' }}>
          SuperAdmin · Admin · Psicólogos
        </div>

        <form onSubmit={handleSubmit}>
          <input
            className="ff"
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            className="ff"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && <div className="err"><i className="ti ti-alert-circle" /> {error}</div>}
          <button className="btn btn-p btn-full" type="submit" disabled={loading}>
            {loading ? 'Ingresando…' : <><i className="ti ti-login" /> Ingresar</>}
          </button>
        </form>

        <Link href="/login" className="btn btn-full" style={{ marginTop: 8, justifyContent: 'center' }}>
          <i className="ti ti-arrow-left" /> Volver
        </Link>
      </div>

      <style>{`
        .screen{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);padding:1.5rem}
        .login-card{background:var(--surface);border-radius:18px;border:0.5px solid var(--border);padding:2.5rem;width:380px;max-width:100%;box-shadow:0 4px 24px rgba(0,0,0,.08)}
        .login-logo{display:flex;align-items:center;gap:10px;margin-bottom:2rem}
        .login-logo .logo-box{width:36px;height:36px;border-radius:10px}
        .appname{font-size:15px;font-weight:600;color:var(--text)}
        .ff{margin-bottom:8px}
      `}</style>
    </div>
  )
}
