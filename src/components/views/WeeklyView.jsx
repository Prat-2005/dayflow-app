import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { C } from '../../constants/theme'
import { dayOfWeek, dayNumber } from '../../utils/dateUtils'

const barColor = (d) => {
  if (d.isToday)   return C.accent
  if (d.perf >= 70) return C.success
  if (d.perf >= 40) return C.warning
  if (d.total > 0)  return C.danger
  return C.border
}

export function WeeklyView({ weekAcc, weekData }) {
  const chartData = weekData.map(d => ({
    ...d,
    day: dayOfWeek(d.date),
    num: dayNumber(d.date),
  }))

  return (
    <>
      {/* Weekly accuracy banner */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18, marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Weekly Accuracy</div>
        <div style={{ fontSize: 42, fontWeight: 700, lineHeight: 1, color: weekAcc >= 70 ? C.success : weekAcc >= 40 ? C.warning : C.danger }}>
          {weekAcc}%
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>
          {weekAcc >= 70
            ? '🔥 Excellent consistency — keep it up!'
            : weekAcc >= 40
              ? '📈 Good progress — push a bit harder!'
              : '💡 Low week — tap Leva for a boost!'}
        </div>
      </div>

      {/* Bar chart */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: '16px 12px', marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, paddingLeft: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
          Daily Performance
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={chartData} barSize={22} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <XAxis dataKey="day" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 12 }}
              formatter={(v, _, p) => [`${v}% (${p.payload.done}/${p.payload.total})`, 'Performance']}
              cursor={{ fill: C.border + '55' }}
            />
            <Bar dataKey="perf" radius={[5, 5, 0, 0]}>
              {chartData.map((d, i) => <Cell key={i} fill={barColor(d)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Day-by-day list */}
      {weekData.map(d => (
        <div key={d.date} style={{
          background:   C.card,
          border:       `1px solid ${d.isToday ? C.accent + '55' : C.border}`,
          borderRadius: 14,
          padding:      '11px 14px',
          marginBottom: 8,
          display:      'flex',
          alignItems:   'center',
          gap:          12,
        }}>
          {/* Date badge */}
          <div style={{ width: 40, height: 40, borderRadius: 10, background: d.isToday ? C.accent + '18' : C.surface, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 9,  color: C.muted, textTransform: 'uppercase' }}>{dayOfWeek(d.date)}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: d.isToday ? C.accent : C.text }}>{dayNumber(d.date)}</div>
          </div>

          {/* Progress bar */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: C.text, marginBottom: 5 }}>{d.done}/{d.total} tasks completed</div>
            <div style={{ height: 5, background: C.surface, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: d.perf + '%', background: barColor(d), borderRadius: 3 }} />
            </div>
          </div>

          {/* Percentage */}
          <div style={{ fontSize: 18, fontWeight: 700, flexShrink: 0, color: barColor(d) }}>
            {d.total > 0 ? d.perf + '%' : '—'}
          </div>
        </div>
      ))}
    </>
  )
}
