'use client'
import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AccesoProfesionalPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) throw err
      window.location.href = '/calendario'
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={S.screen}>
      <a href="https://parcuve.com/" target="_blank" rel="noopener noreferrer" style={S.banner}>
        <i className="ti ti-world" style={{ fontSize: 13 }} />
        parcuve.com — Sitio oficial
        <i className="ti ti-arrow-up-right" style={{ fontSize: 12, opacity: .7 }} />
      </a>

      <div style={S.card}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Image
            src="https://parcuve.com/wp-content/uploads/2026/04/logo-academia-parcuve-1.png"
            alt="Parcuve"
            width={64}
            height={64}
            style={{ objectFit: 'contain', marginBottom: 12 }}
            unoptimized
          />
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.02em', lineHeight: 1.1 }}>
            Parcuve <span style={{ fontWeight: 300 }}>Sin Fronteras</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '.1em' }}>
            Panel de gestión
          </div>
        </div>

        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Acceso profesional</div>
        <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: '1.25rem' }}>
          SuperAdmin · Admin · Psicólogos
        </div>

        <form onSubmit={handleSubmit}>
          <div className="fg">
            <label>Correo electrónico</label>
            <input type="email" placeholder="correo@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="fg">
            <label>Contraseña</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <div className="err"><i className="ti ti-alert-circle" /> {error}</div>}
          <button className="btn btn-p btn-full" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? 'Ingresando…' : <><i className="ti ti-login" /> Ingresar</>}
          </button>
        </form>

        <Link href="/" className="btn btn-full" style={{ marginTop: 10, justifyContent: 'center' }}>
          <i className="ti ti-arrow-left" /> Volver al inicio
        </Link>
      </div>

      <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: 11, color: 'var(--text3)' }}>
        <a href="https://parcuve.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text3)', textDecoration: 'none' }}>
          © {new Date().getFullYear()} Parcuve · parcuve.com
        </a>
      </div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  screen: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
    padding: '1.5rem',
  },
  card: {
    background: 'var(--surface)',
    borderRadius: 16,
    border: '1px solid var(--border)',
    padding: '2.5rem',
    width: 400,
    maxWidth: '100%',
    boxShadow: '0 4px 32px rgba(0,0,0,.07)',
  },
  banner: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: 'var(--primary)',
    color: '#fff',
    borderRadius: 20,
    padding: '5px 14px',
    fontSize: 11,
    fontWeight: 500,
    textDecoration: 'none',
    marginBottom: '1.5rem',
    letterSpacing: '.02em',
  },
}
