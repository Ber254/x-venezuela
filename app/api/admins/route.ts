import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const CreateAdminSchema = z.object({
  full_name: z.string().min(2).max(100),
  email:     z.string().email(),
  password:  z.string().min(8),
})

async function requireSuperAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).single()
  return data?.role === 'superadmin'
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await requireSuperAdmin(supabase, user.id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('profiles')
    .select('id,full_name,email,active,created_at')
    .eq('role', 'admin')
    .order('full_name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await requireSuperAdmin(supabase, user.id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const parsed = CreateAdminSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { full_name, email, password } = parsed.data
  const service = await createServiceClient()

  const { data: newUser, error: authErr } = await service.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { full_name, role: 'admin' },
  })
  if (authErr || !newUser.user) return NextResponse.json({ error: authErr?.message }, { status: 500 })

  const { data, error } = await service
    .from('profiles')
    .upsert({ id: newUser.user.id, email, full_name, role: 'admin', active: true })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
