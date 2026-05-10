// ─── LevaAvatar — mood-reactive SVG character ─────────────────────────────
import React from 'react'
import { C } from '../constants/theme'

const MOODS = {
  happy:   { eyeL: 'M17,23 Q19,21 21,23', eyeR: 'M37,23 Q39,21 41,23', mouth: 'M25,34 Q30,39 35,34', ec: C.accent },
  sad:     { eyeL: 'M17,25 Q19,27 21,25', eyeR: 'M37,25 Q39,27 41,25', mouth: 'M25,38 Q30,34 35,38', ec: '#8888cc' },
  neutral: { eyeL: 'M17,24 L21,24',       eyeR: 'M37,24 L41,24',       mouth: 'M25,36 L35,36',       ec: C.muted  },
  excited: { eyeL: 'M17,22 Q19,19 21,22', eyeR: 'M37,22 Q39,19 41,22', mouth: 'M23,33 Q30,41 37,33', ec: C.success},
}

export function LevaAvatar({ mood = 'happy', size = 60, glow = false }) {
  const e = MOODS[mood] ?? MOODS.neutral
  return (
    <svg
      width={size} height={size} viewBox="0 0 58 58"
      style={glow ? { filter: `drop-shadow(0 0 10px ${C.purple})` } : undefined}
    >
      <circle cx="29" cy="30" r="25" fill={C.card} stroke={C.purple} strokeWidth="1.5" />
      {/* antenna */}
      <line x1="29" y1="5" x2="29" y2="13" stroke={C.accent} strokeWidth="1.5" />
      <circle cx="29" cy="4" r="2.5" fill={C.accent} />
      {/* eyes */}
      <path d={e.eyeL} stroke={e.ec} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d={e.eyeR} stroke={e.ec} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* blush */}
      <ellipse cx="19" cy="29" rx="4" ry="3" fill={C.purple} opacity="0.25" />
      <ellipse cx="39" cy="29" rx="4" ry="3" fill={C.purple} opacity="0.25" />
      {/* mouth */}
      <path d={e.mouth} stroke={e.ec} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* excited sparkles */}
      {mood === 'excited' && (
        <>
          <circle cx="9"  cy="16" r="1.5" fill={C.accent}  opacity="0.9" />
          <circle cx="49" cy="16" r="1.5" fill={C.accent}  opacity="0.9" />
          <circle cx="7"  cy="26" r="1"   fill={C.purple}  opacity="0.8" />
          <circle cx="51" cy="26" r="1"   fill={C.purple}  opacity="0.8" />
        </>
      )}
    </svg>
  )
}
