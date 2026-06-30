import { createBrowserClient } from '@supabase/ssr'

function clean(s: string | undefined) {
  return (s ?? '').replace(/^﻿/g, '').replace(/[^\x20-\x7E\x80-\xFF]/g, '').trim()
}

export function createClient() {
  const url = clean(process.env.NEXT_PUBLIC_SUPABASE_URL) || 'https://placeholder.supabase.co'
  const key = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) || 'placeholder-key'
  return createBrowserClient(url, key)
}
