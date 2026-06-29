import { createBrowserClient } from '@supabase/ssr'

// Strip BOM and non-ISO-8859-1 chars that break HTTP headers
function clean(s: string | undefined) {
  return (s ?? '').replace(/^﻿/, '').replace(/[^\x00-\xFF]/g, '').trim()
}

export function createClient() {
  return createBrowserClient(
    clean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  )
}
