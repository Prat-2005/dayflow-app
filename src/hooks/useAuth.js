// ─── useAuth — Supabase authentication state hook ─────────────────────────
import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'
import { storage } from '../utils/storage'

// In Electron the window loads from file://, so we use a custom protocol.
const isElectron = typeof window !== 'undefined' && !!window.electronAPI

// Always use dayflow:// in Electron (dev AND prod).
// Reason: magic-link redirect to localhost:5173 opens in Chrome, which stores
// the session in Chrome's localStorage — Electron has its own separate
// localStorage and NEVER sees it. dayflow:// routes the token directly to
// the running Electron process via the OS protocol handler + IPC.
const REDIRECT_URL = isElectron
  ? 'dayflow://auth/callback'
  : (typeof window !== 'undefined' ? window.location.origin : '')


export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth state changes (works in both browser and Electron)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`[Auth] State Change: ${event} | User: ${session?.user?.email || 'none'}`)
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // ── Electron deep-link handler ──────────────────────────────────────────
  // When the user clicks the magic-link email, Supabase redirects to
  // dayflow://auth/callback#access_token=...&refresh_token=...
  // Electron intercepts it and sends it here via IPC.
  useEffect(() => {
    if (!isElectron || !supabase || !window.electronAPI?.onAuthDeepLink) return

    const handleDeepLink = async (url) => {
      console.log('[Auth] Received deep-link URL:', url)
      try {
        // Parse the hash fragment from the deep-link URL
        const hashPart = url.split('#')[1] || url.split('?')[1] || ''
        const params = new URLSearchParams(hashPart)
        const access_token  = params.get('access_token')
        const refresh_token = params.get('refresh_token')

        if (access_token && refresh_token) {
          console.log('[Auth] Attempting to set session...')
          const { data, error } = await supabase.auth.setSession({ access_token, refresh_token })
          
          if (error) {
            console.error('[Auth] setSession error:', error.message)
          } else if (data.session) {
            console.log('[Auth] Session set successfully ✓ User:', data.session.user.email)
            // Manually set user to ensure immediate UI update
            setUser(data.session.user)
          }
        } else {
          console.warn('[Auth] Deep-link missing tokens')
        }
      } catch (err) {
        console.error('[Auth] Deep-link handling error:', err)
      }
    }

    window.electronAPI.onAuthDeepLink(handleDeepLink)
  }, [])

  const signInWithEmail = async (email) => {
    if (!supabase) throw new Error('Supabase not configured')

    const res = await fetch('http://localhost:3000/api/auth/send-magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, redirectTo: REDIRECT_URL }),
    })
    
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to send magic link')
    }
  }

  const signOut = async () => {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    // Clear local storage to prevent data leakage between different users
    storage.clearAll()
    
    // Refresh to ensure all hooks/state are reset cleanly
    window.location.reload()
  }

  return { user, loading, signInWithEmail, signOut }
}

