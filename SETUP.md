# X-Venezuela — Guía de configuración

## 1. Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ir a **SQL Editor** y ejecutar `supabase/schema.sql` completo
3. En **Authentication > Providers**, activar **Email** y habilitar **Magic Link**
4. Crear el SuperAdmin vía Supabase Dashboard:
   - Authentication > Users > Invite User → `super@x-venezuela.org`
   - Luego en SQL Editor:
     ```sql
     INSERT INTO profiles (id, email, full_name, role)
     VALUES ('<uuid-del-usuario>', 'super@x-venezuela.org', 'SuperAdmin', 'superadmin');
     ```
5. Copiar `Project URL` y `anon key` y `service_role key`

## 2. Google Calendar (Service Account)

1. Ir a [Google Cloud Console](https://console.cloud.google.com)
2. Crear proyecto → habilitar **Google Calendar API**
3. IAM & Admin > Service Accounts > Crear cuenta de servicio
4. Crear clave JSON → guardar contenido de `private_key` y `client_email`
5. En Google Workspace Admin (si aplica):
   - Security > API Controls > Domain-wide Delegation
   - Agregar Client ID del Service Account con scope: `https://www.googleapis.com/auth/calendar`
6. El calendario del `GOOGLE_CALENDAR_DELEGATION_EMAIL` es donde se crearán los eventos

## 3. Resend (emails)

1. Crear cuenta en [resend.com](https://resend.com)
2. Verificar tu dominio (`x-venezuela.org`)
3. Copiar API Key

## 4. Variables de entorno

Copiar `.env.example` → `.env.local` y completar todos los valores.

## 5. Deploy en Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

En Vercel Dashboard > Settings > Environment Variables: cargar todas las variables del `.env.example`.

## 6. Desarrollo local

```bash
npm install
cp .env.example .env.local
# Completar .env.local
npm run dev
```

## Flujo de roles

| Ruta | Roles |
|------|-------|
| `/login` | Pacientes (Magic Link) |
| `/acceso-profesional` | Admin, SuperAdmin, Psicólogo (email+pass) |
| `/calendario` | Admin, SuperAdmin, Psicólogo |
| `/psicologos` | Admin, SuperAdmin |
| `/disponibilidad` | Admin, SuperAdmin |
| `/admins` | SuperAdmin |
| `/reportes` | SuperAdmin |
| `/base-datos` | SuperAdmin |
| `/inasistencias` | Psicólogo |
| `/reservar` | Paciente |
| `/mis-turnos` | Paciente |

## Seguridad implementada

- **RLS** en todas las tablas de Supabase
- **JWT** Supabase Auth (no sesiones propias)
- **Magic Link** para pacientes (sin contraseñas)
- **Validación Zod** en todas las API routes
- **Unique constraint** en DB previene doble-booking (race conditions)
- **Quota check** server-side (3 turnos/semana)
- **Security headers** (CSP, X-Frame-Options, etc.) en `next.config.ts`
- **Service Role** solo en contexto servidor, nunca expuesto al cliente
- **Middleware** protege todas las rutas excepto auth
