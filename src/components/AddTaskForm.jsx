// ─── AddTaskForm — inline form to create a new task ───────────────────────
import React, { useState } from 'react'
import { C, CATEGORIES } from '../constants/theme'

export function AddTaskForm({ onAdd, onCancel }) {
  const [text, setCat0]  = useState('')
  const [category, setCat] = useState('Personal')

  const inp = (extra = {}) => ({
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 10, padding: '8px 12px',
    color: C.text, fontFamily: 'inherit', fontSize: 14,
    outline: 'none', width: '100%', boxSizing: 'border-box',
    ...extra,
  })

  const submit = () => {
    if (!text.trim()) return
    onAdd({ text, category })
    setCat0('')
    setCat('Personal')
  }

  return (
    <div style={{
      background: C.card, border: `1.5px solid ${C.accent}44`,
      borderRadius: 14, padding: 14, marginTop: 8,
    }}>
      <input
        autoFocus value={text}
        onChange={e => setCat0(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        placeholder="What needs to get done?"
        style={{ ...inp(), marginBottom: 10, border: `1px solid ${C.accent}` }}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <select value={category} onChange={e => setCat(e.target.value)}
          style={{ ...inp({ flex: 1, padding: '6px 10px', fontSize: 12 }) }}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <button onClick={submit}
          style={{ background: C.accent, border: 'none', borderRadius: 10, padding: '7px 16px', color: C.bg, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 13 }}>
          Add
        </button>
        <button onClick={onCancel}
          style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 10, padding: '7px 12px', color: C.muted, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
          Cancel
        </button>
      </div>
    </div>
  )
}
