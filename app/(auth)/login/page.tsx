'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail]   = useState('')
  const [name, setName]     = useState('')
  const [sent, setSent]     = useState(false)
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.includes('@')) { setError('Ingresá un correo válido'); return }

    setLoading(true)
    try {
      // Store name in user_metadata for profile creation trigger
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${location.origin}/api/auth/callback`,
          data: { full_name: name || email.split('@')[0], role: 'user' },
        },
      })
      if (err) throw err
      setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al enviar el correo')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="screen">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: '1rem' }}>📬</div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Revisá tu correo</h2>
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
            Te enviamos un enlace mágico a <strong>{email}</strong>.<br />
            Hacé clic en el enlace para ingresar. No necesitás contraseña.
          </p>
          <button className="btn btn-full" style={{ marginTop: '1.5rem' }} onClick={() => setSent(false)}>
            <i className="ti ti-arrow-left" /> Volver
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-box"><i className="ti ti-heart-handshake" /></div>
          <div>
            <div className="appname">Parcuve <span style={{ color: 'var(--green)' }}>Sin Fronteras</span></div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>Asistencia psicológica gratuita</div>
          </div>
        </div>

        <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 5 }}>Reservá tu turno</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Ingresá tu correo para acceder. Te enviaremos un enlace de ingreso automático.
        </div>

        <form onSubmit={handleSubmit}>
          <input
            className="ff"
            type="email"
            placeholder="tucorreo@ejemplo.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            className="ff"
            type="text"
            placeholder="Tu nombre (solo la primera vez)"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          {error && <div className="err"><i className="ti ti-alert-circle" /> {error}</div>}
          <button className="btn btn-p btn-full" type="submit" disabled={loading}>
            {loading ? 'Enviando…' : <><i className="ti ti-send" /> Enviar enlace de acceso</>}
          </button>
        </form>

        <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '0.5px solid var(--border)', textAlign: 'center' }}>
          <Link href="/acceso-profesional" style={{ fontSize: 11, color: 'var(--text3)', textDecoration: 'underline' }}>
            Acceso profesional
          </Link>
        </div>
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
