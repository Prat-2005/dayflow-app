import { Calendar, BarChart2, Settings as SettingsIcon } from 'lucide-react'
import { C } from '../constants/theme'
import { LevaAvatar } from './LevaAvatar'

const NAV = [
  ['today',   'Today',   Calendar    ],
  ['weekly',  'Weekly',  BarChart2   ],
  ['settings','Settings',SettingsIcon],
]

export function Header({ view, setView, weekAcc, levaMood, onLevaClick }) {
  return (
    <div style={{
      background:    C.surface + 'ee',
      backdropFilter:'blur(10px)',
      borderBottom:  `1px solid ${C.border}`,
      padding:       '14px 20px',
      position:      'sticky',
      top:           0,
      zIndex:        10,
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.accent, letterSpacing: '-0.5px' }}>DayFlow</div>
          <div style={{ fontSize: 11, color: C.muted }}>
            {new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Weekly accuracy badge */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '5px 12px', fontSize: 12 }}>
            <span style={{
              color:      weekAcc >= 70 ? C.success : weekAcc >= 40 ? C.warning : C.danger,
              fontWeight: 700,
            }}>{weekAcc}%</span>
            <span style={{ color: C.muted }}> this week</span>
          </div>
          {/* Leva avatar button */}
          <div style={{ cursor: 'pointer' }} onClick={onLevaClick}>
            <LevaAvatar mood={levaMood} size={42} />
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div style={{ display: 'flex', gap: 4 }}>
        {NAV.map(([v, label, Icon]) => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              flex:        1,
              padding:     '7px 4px',
              borderRadius:9,
              border:      'none',
              cursor:      'pointer',
              background:  view === v ? C.accent : 'transparent',
              color:       view === v ? C.bg : C.muted,
              fontFamily:  'inherit',
              fontWeight:  600,
              fontSize:    12,
              display:     'flex',
              alignItems:  'center',
              justifyContent: 'center',
              gap:         5,
            }}
          >
            <Icon size={13} />{label}
          </button>
        ))}
      </div>
    </div>
  )
}
