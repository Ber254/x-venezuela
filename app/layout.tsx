import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Parcuve Sin Fronteras — Atención Psicológica',
  description: 'Plataforma de atención psicológica gratuita para venezolanos',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
