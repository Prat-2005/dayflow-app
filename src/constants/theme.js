// ─── DayFlow Design Tokens ─────────────────────────────────────────────────
export const C = {
  bg:      '#07071a',
  surface: '#0e0e28',
  card:    '#151535',
  border:  '#252550',
  accent:  '#00d4ff',
  purple:  '#9b5cff',
  text:    '#e2e2ff',
  muted:   '#6060a0',
  success: '#00e87a',
  warning: '#f0a020',
  danger:  '#ff3355',
}

export const FONT = "'Space Grotesk', 'Outfit', sans-serif"

export const CATEGORIES = ['Work', 'Health', 'Learning', 'Personal', 'Other']

export const CAT_COLORS = {
  Work:     C.accent,
  Health:   C.success,
  Learning: C.purple,
  Personal: C.warning,
  Other:    C.muted,
}

// Leva moods — perf thresholds
export const MOOD_THRESHOLDS = { excited: 80, happy: 45 }

export const QUICK_PROMPTS = [
  'How am I doing?',
  'Give me a tip!',
  'Motivate me!',
  'I feel stuck.',
  'Why low performance?',
]
