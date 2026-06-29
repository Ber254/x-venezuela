import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { PSIC_COLORS } from '@/lib/utils'

const CreatePsicSchema = z.object({
  full_name: z.string().min(2).max(100),
  email:     z.string().email(),
  password:  z.string().min(8),
  specialty: z.string().min(2).max(100),
})

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).single()
  return data && ['admin','superadmin'].includes(data.role)
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('profiles')
    .select('id,full_name,email,specialty,color,active,created_at')
    .eq('role', 'psic')
    .order('full_name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await requireAdmin(supabase, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const parsed = CreatePsicSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { full_name, email, password, specialty } = parsed.data

  // Count existing psics to assign a color
  const { count } = await supabase
    .from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'psic')
  const color = PSIC_COLORS[(count ?? 0) % PSIC_COLORS.length]

  // Create Supabase Auth user (service role)
  const service = await createServiceClient()
  const { data: newUser, error: authErr } = await service.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { full_name, role: 'psic' },
  })

  if (authErr || !newUser.user) {
    return NextResponse.json({ error: authErr?.message ?? 'Error creando usuario' }, { status: 500 })
  }

  // Upsert profile (trigger may have already created it)
  const { data: profile, error: profileErr } = await service
    .from('profiles')
    .upsert({ id: newUser.user.id, email, full_name, role: 'psic', specialty, color, active: true })
    .select().single()

  if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 })
  return NextResponse.json(profile, { status: 201 })
}
