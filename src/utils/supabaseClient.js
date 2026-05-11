// ─── Supabase Client ──────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY

// Detect if we're running inside Electron (desktop) vs browser
const isElectron = typeof window !== 'undefined' && !!window.electronAPI

if (!supabaseUrl || !supabaseAnon) {
  console.warn('[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — cloud sync disabled')
}

export const supabase = (supabaseUrl && supabaseAnon)
  ? createClient(supabaseUrl, supabaseAnon, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        // Tokens arrive via dayflow:// IPC deep-link in Electron (not URL hash).
        // In browser, Supabase detects the token from the URL hash normally.
        detectSessionInUrl: !isElectron,
      },
    })
  : null



