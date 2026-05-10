// ─── LevaChat — floating FAB + chat panel ─────────────────────────────────
import React, { useState } from 'react'
import { C, QUICK_PROMPTS } from '../constants/theme'
import { LevaAvatar } from './LevaAvatar'
import { useLeva } from '../hooks/useLeva'

export function LevaChat({ mood, contextPayload }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const { messages, loading, send, chatEndRef } = useLeva(contextPayload)

  const submit = () => {
    send(input)
    setInput('')
  }

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 200 }}>

      {/* ── Chat panel ──────────────────────────────────────────────────── */}
      {open && (
        <div style={{
          position: 'absolute', bottom: 66, right: 0, width: 330,
          background: C.surface, border: `1px solid ${C.purple}66`,
          borderRadius: 22, boxShadow: `0 12px 48px ${C.purple}44`, overflow: 'hidden',
        }}>
          {/* header */}
          <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <LevaAvatar mood={mood} size={36} glow />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>Leva</div>
              <div style={{ fontSize: 11, color: C.muted }}>Your AI companion • Always here</div>
            </div>
            <button onClick={() => setOpen(false)}
              style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>
              ✕
            </button>
          </div>

          {/* messages */}
          <div style={{ height: 250, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '84%', padding: '8px 12px', lineHeight: 1.5,
                  borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: m.role === 'user' ? C.accent + '22' : C.card,
                  border: `1px solid ${m.role === 'user' ? C.accent + '55' : C.border}`,
                  fontSize: 13, color: C.text,
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 4, padding: '4px 12px' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 7, height: 7, borderRadius: '50%', background: C.purple,
                    animation: `ldot 1s ease-in-out ${i * 0.22}s infinite`,
                  }} />
                ))}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* quick prompts */}
          <div style={{ padding: '0 12px 8px', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {QUICK_PROMPTS.map(q => (
              <button key={q} onClick={() => send(q)} style={{
                padding: '4px 10px', borderRadius: 20,
                border: `1px solid ${C.border}`, background: 'transparent',
                color: C.muted, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {q}
              </button>
            ))}
          </div>

          {/* input row */}
          <div style={{ padding: '8px 12px 14px', display: 'flex', gap: 8 }}>
            <input
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="Talk to Leva…"
              style={{
                flex: 1, background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: '8px 12px',
                color: C.text, fontFamily: 'inherit', fontSize: 13, outline: 'none',
              }}
            />
            <button onClick={submit} disabled={loading} style={{
              background: C.purple, border: 'none', borderRadius: 10,
              padding: '8px 13px', color: '#fff', cursor: 'pointer',
              opacity: loading ? 0.5 : 1,
            }}>
              ➤
            </button>
          </div>
        </div>
      )}

      {/* ── FAB ─────────────────────────────────────────────────────────── */}
      <button onClick={() => setOpen(p => !p)} style={{
        width: 58, height: 58, borderRadius: '50%',
        border: `2px solid ${C.purple}`, background: C.card, cursor: 'pointer',
        boxShadow: `0 0 24px ${C.purple}66`, padding: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <LevaAvatar mood={mood} size={44} />
      </button>

      <style>{`
        @keyframes ldot { 0%,100%{transform:translateY(0);opacity:.3} 50%{transform:translateY(-5px);opacity:1} }
      `}</style>
    </div>
  )
}
