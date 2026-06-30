'use client'
import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function Home() {
  const [email, setEmail]     = useState('')
  const [name, setName]       = useState('')
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.includes('@')) { setError('Ingresá un correo válido'); return }
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${location.origin}/api/auth/callback?next=/reservar`,
          data: { full_name: name || email.split('@')[0], role: 'user' },
        },
      })
      if (err) {
        setError(err.message || err.name || 'Error al enviar el correo')
        return
      }
      setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div style={S.screen}>
        <div style={S.card}>
          <div style={{ fontSize: 48, marginBottom: '1rem', textAlign: 'center' }}>📬</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>Revisá tu correo</h2>
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, textAlign: 'center' }}>
            Te enviamos un enlace mágico a <strong>{email}</strong>.<br />
            Hacé clic en el enlace para ingresar sin contraseña.
          </p>
          <button className="btn btn-full" style={{ marginTop: '1.5rem' }} onClick={() => setSent(false)}>
            <i className="ti ti-arrow-left" /> Volver
          </button>
        </div>
      </div>
    )
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
            width={72}
            height={72}
            style={{ objectFit: 'contain', marginBottom: 12 }}
            unoptimized
          />
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.02em', lineHeight: 1.1 }}>
            Parcuve <span style={{ fontWeight: 300 }}>Sin Fronteras</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '.1em' }}>
            Atención psicológica gratuita
          </div>
        </div>

        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 5 }}>Reservá tu turno</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: '1.5rem', lineHeight: 1.7 }}>
          Ingresá tu correo para acceder. Te enviaremos un enlace de ingreso automático — sin contraseña.
        </div>

        <form onSubmit={handleSubmit}>
          <div className="fg">
            <label>Correo electrónico</label>
            <input type="email" placeholder="tucorreo@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="fg">
            <label>Tu nombre <span style={{ fontWeight: 400, color: 'var(--text3)' }}>(solo la primera vez)</span></label>
            <input type="text" placeholder="Nombre y apellido" value={name} onChange={e => setName(e.target.value)} />
          </div>
          {error && <div className="err"><i className="ti ti-alert-circle" /> {error}</div>}
          <button className="btn btn-p btn-full" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? 'Enviando…' : <><i className="ti ti-search" /> Busca un turno disponible</>}
          </button>
        </form>

        <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <Link href="/acceso-profesional" style={{ fontSize: 11, color: 'var(--text3)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Acceso profesional (Admin · Psicólogos)
          </Link>
        </div>
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
