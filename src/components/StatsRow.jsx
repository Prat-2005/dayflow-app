// ─── StatsRow — three stat cards at the top of Today view ─────────────────
import React from 'react'
import { C } from '../constants/theme'

export function StatsRow({ done, pending, accuracy }) {
  const cards = [
    { label: 'Done',     value: done,         color: C.success, icon: '✓' },
    { label: 'Pending',  value: pending,       color: C.warning, icon: '◷' },
    { label: 'Accuracy', value: accuracy + '%', color: C.accent,  icon: '◎' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
      {cards.map(({ label, value, color, icon }) => (
        <div key={label} style={{
          background: `linear-gradient(135deg, ${C.card}, ${C.surface})`,
          border: `1px solid ${C.border}`,
          borderRadius: 16, padding: '18px 14px', textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* subtle glow */}
          <div style={{
            position: 'absolute', top: -10, right: -10, width: 50, height: 50,
            borderRadius: '50%', background: color + '10', filter: 'blur(18px)',
          }} />
          <div style={{ fontSize: 10, color: C.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1, position: 'relative' }}>
            {label}
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1, position: 'relative' }}>{value}</div>
        </div>
      ))}
    </div>
  )
}
