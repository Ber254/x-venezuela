'use client'
import { useEffect } from 'react'

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[Dashboard Error]', error)
  }, [error])

  return (
    <div style={{ padding: '2rem', maxWidth: 600 }}>
      <div style={{ background: '#FDF0EE', border: '1px solid #E8B4AE', borderRadius: 12, padding: '1.5rem' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#8B2B22', marginBottom: 8 }}>
          Error al cargar esta sección
        </div>
        <div style={{ fontSize: 12, color: '#A03A30', marginBottom: 16, fontFamily: 'monospace', background: '#FEE8E5', padding: '8px 12px', borderRadius: 6 }}>
          {error.message || 'Error desconocido'}
        </div>
        <button
          onClick={reset}
          style={{ fontSize: 12, padding: '6px 16px', borderRadius: 6, border: '1px solid #C94B3C', background: 'transparent', color: '#8B2B22', cursor: 'pointer' }}
        >
          Reintentar
        </button>
      </div>
    </div>
  )
}
