// ─── AuthSection — Sign-in/out UI for Supabase magic link auth ────────────
import React, { useState } from 'react'
import { C } from '../constants/theme'

export function AuthSection({ user, onSignIn, onSignOut, syncing }) {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  const handleSignIn = async () => {
    if (!email.trim()) return
    setSending(true)
    setError(null)
    setSent(false)

    try {
      await onSignIn(email.trim())
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  // ── Signed IN state ──
  if (user) {
    const initials = (user.email || '??')
      .split('@')[0]
      .slice(0, 2)
      .toUpperCase()

    return (
      <div style={{
        background: C.card, border: `1px solid ${C.accent}33`,
        borderRadius: 18, padding: 20, marginBottom: 14,
      }}>
        <div style={{
          fontSize: 12, fontWeight: 700, color: C.accent, marginBottom: 14,
          textTransform: 'uppercase', letterSpacing: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>Cloud Sync</span>
          {syncing && (
            <span style={{ fontSize: 10, color: C.muted, fontWeight: 400, textTransform: 'none' }}>
              ⟳ Syncing...
            </span>
          )}
          {!syncing && (
            <span style={{ fontSize: 10, color: C.success, fontWeight: 400, textTransform: 'none' }}>
              ● Connected
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          {/* Avatar circle */}
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>
              Signed in • tasks synced across devices
            </div>
          </div>
        </div>

        <button onClick={onSignOut} style={{
          width: '100%', padding: '9px 14px', borderRadius: 10,
          background: 'transparent', border: `1px solid ${C.border}`,
          color: C.muted, fontFamily: 'inherit', fontSize: 12, cursor: 'pointer',
          transition: 'border-color .15s, color .15s',
        }}>
          Sign Out
        </button>
      </div>
    )
  }

  // ── Signed OUT state ──
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 18, padding: 20, marginBottom: 14,
    }}>
      <div style={{
        fontSize: 12, fontWeight: 700, color: C.accent, marginBottom: 6,
        textTransform: 'uppercase', letterSpacing: 1,
      }}>
        Cloud Sync
      </div>
      <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 14 }}>
        Sign in to sync your tasks across all your devices in real time.
      </div>

      {sent ? (
        <div style={{
          background: C.success + '15', border: `1px solid ${C.success}33`,
          borderRadius: 12, padding: '12px 14px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.success, marginBottom: 4 }}>
            ✉️ Magic link sent!
          </div>
          <div style={{ fontSize: 12, color: C.muted }}>
            Check your inbox and click the link to sign in.
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSignIn()}
              placeholder="your@email.com"
              style={{
                flex: 1, background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: '9px 12px', color: C.text,
                fontFamily: 'inherit', fontSize: 13, outline: 'none',
              }}
            />
            <button
              onClick={handleSignIn}
              disabled={sending || !email.trim()}
              style={{
                padding: '9px 16px', borderRadius: 10, border: 'none',
                background: C.accent, color: C.bg, fontFamily: 'inherit',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                opacity: sending || !email.trim() ? 0.5 : 1,
                transition: 'opacity .15s',
                whiteSpace: 'nowrap',
              }}
            >
              {sending ? 'Sending...' : 'Sign in with Email'}
            </button>
          </div>

          {error && (
            <div style={{ fontSize: 12, color: C.danger, marginTop: 8 }}>
              {error}
            </div>
          )}
        </>
      )}
    </div>
  )
}
