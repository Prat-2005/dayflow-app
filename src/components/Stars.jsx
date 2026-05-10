// ─── Stars — static deep-space background ─────────────────────────────────
import React, { useMemo } from 'react'
import { C } from '../constants/theme'

export function Stars() {
  // deterministic positions — no Math.random() on render
  const stars = useMemo(() =>
    Array.from({ length: 35 }, (_, i) => ({
      left:    ((i * 137.5) % 100).toFixed(1),
      top:     ((i * 71.3)  % 100).toFixed(1),
      size:    (1 + (i % 3) * 0.7).toFixed(1),
      color:   i % 3 === 0 ? C.accent : i % 3 === 1 ? C.purple : '#ffffff',
      opacity: (0.08 + (i % 5) * 0.06).toFixed(2),
    })), []
  )
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      {stars.map((s, i) => (
        <div key={i} style={{
          position: 'absolute',
          left:     s.left    + '%',
          top:      s.top     + '%',
          width:    s.size    + 'px',
          height:   s.size    + 'px',
          background:   s.color,
          borderRadius: '50%',
          opacity:      s.opacity,
        }} />
      ))}
    </div>
  )
}
