// ─── TaskItem — single task row with inline edit ──────────────────────────
import React, { useState } from 'react'
import { C, CATEGORIES, CAT_COLORS } from '../constants/theme'

export function TaskItem({ task, onToggle, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState({ text: task.text, category: task.category })

  const save = () => {
    if (!draft.text.trim()) return
    onUpdate(task.id, { text: draft.text.trim(), category: draft.category })
    setEditing(false)
  }

  const inp = {
    background: C.surface, border: `1px solid ${C.accent}`,
    borderRadius: 8, padding: '6px 10px',
    color: C.text, fontFamily: 'inherit', fontSize: 14,
    outline: 'none', width: '100%', boxSizing: 'border-box',
  }

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${task.completed ? C.success + '55' : C.border}`,
      borderRadius: 14, padding: '12px 14px', marginBottom: 8,
      opacity: task.completed ? 0.65 : 1, transition: 'opacity .2s, border-color .2s',
    }}>
      {editing ? (
        /* ── edit mode ─────────────────────────────── */
        <div>
          <input
            autoFocus value={draft.text}
            onChange={e => setDraft(d => ({ ...d, text: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && save()}
            style={{ ...inp, marginBottom: 8 }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <select
              value={draft.category}
              onChange={e => setDraft(d => ({ ...d, category: e.target.value }))}
              style={{ ...inp, flex: 1, padding: '5px 8px', fontSize: 12 }}
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <button onClick={save}
              style={{ background: C.success, border: 'none', borderRadius: 8, padding: '5px 14px', color: C.bg, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 12 }}>
              Save
            </button>
            <button onClick={() => setEditing(false)}
              style={{ background: C.danger, border: 'none', borderRadius: 8, padding: '5px 10px', color: '#fff', cursor: 'pointer', fontSize: 12 }}>
              ✕
            </button>
          </div>
        </div>
      ) : (
        /* ── display mode ──────────────────────────── */
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* checkbox */}
          <div onClick={() => onToggle(task.id)} style={{
            width: 24, height: 24, borderRadius: 7, flexShrink: 0, cursor: 'pointer',
            border: `2px solid ${task.completed ? C.success : C.border}`,
            background: task.completed ? C.success : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all .15s',
          }}>
            {task.completed && (
              <svg width="13" height="13" viewBox="0 0 13 13">
                <polyline points="2,7 5,10 11,3" stroke={C.bg} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>

          {/* text + category */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 14,
              textDecoration: task.completed ? 'line-through' : 'none',
              color: task.completed ? C.muted : C.text,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {task.text}
            </div>
            <div style={{ fontSize: 11, color: CAT_COLORS[task.category] || C.muted, marginTop: 2 }}>
              {task.category}
            </div>
          </div>

          {/* action buttons */}
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            <button onClick={() => setEditing(true)}
              title="Edit task"
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 32, height: 32, transition: 'background .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = C.surface}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button onClick={() => onDelete(task.id)}
              title="Delete task"
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 32, height: 32, transition: 'background .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = C.danger + '18'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
