/**
 * GET /api/slots?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Public endpoint — returns available slots without requiring auth.
 * Returns psic info (name, specialty, color) but NOT email.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { slotsFromShift } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to   = searchParams.get('to')

  if (!from || !to) {
    return NextResponse.json({ error: 'from and to are required' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  const [psicsRes, availRes, bookingsRes] = await Promise.all([
    supabase.from('profiles')
      .select('id,full_name,specialty,color')
      .eq('role', 'psic').eq('active', true),
    supabase.from('availability')
      .select('*')
      .lte('valid_from', to).gte('valid_until', from),
    supabase.from('bookings')
      .select('date,hour,psic_id')
      .gte('date', from).lte('date', to),
  ])

  const psics     = psicsRes.data    ?? []
  const avails    = availRes.data    ?? []
  const bookings  = bookingsRes.data ?? []

  // Build slot map per date
  const result: Record<string, { hour: string; available: number; psics: { id: string; name: string; specialty: string; color: string }[] }[]> = {}

  // Iterate each day in range
  const start = new Date(from + 'T12:00:00')
  const end   = new Date(to   + 'T12:00:00')
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const ds  = d.toISOString().split('T')[0]
    const dow = d.getDay()

    const slotMap: Record<string, { id: string; name: string; specialty: string; color: string }[]> = {}

    psics.forEach(psic => {
      const dayAvails = avails.filter(av =>
        av.psic_id === psic.id &&
        av.valid_from <= ds && av.valid_until >= ds &&
        (av.days as number[]).includes(dow)
      )
      dayAvails.forEach(av => {
        (av.shifts as { start: string; end: string }[]).forEach(sh => {
          slotsFromShift(sh.start, sh.end).forEach(hour => {
            const taken = bookings.find(b => b.date === ds && b.psic_id === psic.id && b.hour === hour)
            if (!taken) {
              if (!slotMap[hour]) slotMap[hour] = []
              slotMap[hour].push({ id: psic.id, name: psic.full_name, specialty: psic.specialty ?? '', color: psic.color ?? '#1A1A18' })
            }
          })
        })
      })
    })

    if (Object.keys(slotMap).length > 0) {
      result[ds] = Object.entries(slotMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([hour, psics]) => ({ hour, available: psics.length, psics }))
    }
  }

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
  })
}
