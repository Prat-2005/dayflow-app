// ─── WeeklyView ───────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { C } from '../constants/theme'
import { buildWeekData, calcWeekAcc } from '../utils/helpers'
import { analyzePerformance } from '../utils/levaAI'
import { LevaAvatar } from '../components/LevaAvatar'

export function WeeklyView({ tasks, userName }) {
  const weekAcc  = calcWeekAcc(tasks)
  const weekData = buildWeekData(tasks)

  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const lastFetch = useRef(null)

  useEffect(() => {
    // Auto-refresh: only re-fetch if we haven't fetched yet, or if it's a new Sunday
    const now = new Date()
    const thisSunday = new Date(now)
    thisSunday.setDate(thisSunday.getDate() - thisSunday.getDay())
    thisSunday.setHours(0, 0, 0, 0)
    const sundayKey = thisSunday.toISOString()

    if (lastFetch.current === sundayKey && report) return
    if (tasks.length === 0) return

    setLoading(true)
    setError(null)
    analyzePerformance(tasks, userName || 'Friend')
      .then(r => {
        setReport(r)
        lastFetch.current = sundayKey
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [tasks.length]) // re-run when task count changes

  const barColor = (d) => {
    if (d.isToday) return C.accent
    if (d.perf >= 70) return C.success
    if (d.perf >= 40) return C.warning
    if (d.total > 0)  return C.danger
    return C.border
  }

  const accColor = weekAcc >= 70 ? C.success : weekAcc >= 40 ? C.warning : C.danger
  const accLabel = weekAcc >= 70
    ? '🔥 Excellent consistency — keep it up!'
    : weekAcc >= 40
    ? '📈 Good progress — push a bit harder!'
    : '💡 Low week — talk to Leva for a boost!'

  const trendIcon = { improving: '📈', declining: '📉', stable: '➡️' }
  const trendColor = { improving: C.success, declining: C.danger, stable: C.warning }

  return (
    <div>
      {/* summary card */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18, marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Weekly Accuracy</div>
        <div style={{ fontSize: 42, fontWeight: 700, color: accColor, lineHeight: 1 }}>{weekAcc}%</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>{accLabel}</div>
      </div>

      {/* bar chart */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: '16px 12px', marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, paddingLeft: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Daily Breakdown</div>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={weekData} barSize={22} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <XAxis dataKey="day" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 12 }}
              formatter={(v, _, p) => [`${v}% (${p.payload.done}/${p.payload.total} tasks)`, 'Performance']}
              cursor={{ fill: C.border + '44' }}
            />
            <Bar dataKey="perf" radius={[5, 5, 0, 0]}>
              {weekData.map((d, i) => <Cell key={i} fill={barColor(d)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Leva's Insights card ────────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${C.card}, ${C.surface})`,
        border: `1px solid ${C.accent}33`,
        borderRadius: 18, padding: 20, marginBottom: 14,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* subtle glow */}
        <div style={{
          position: 'absolute', top: -30, right: -30, width: 100, height: 100,
          borderRadius: '50%', background: C.accent + '12', filter: 'blur(30px)',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, position: 'relative' }}>
          <LevaAvatar mood={weekAcc >= 70 ? 'excited' : weekAcc >= 40 ? 'happy' : 'sad'} size={32} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>Leva's Insights</div>
            <div style={{ fontSize: 10, color: C.muted }}>AI-powered analysis • refreshes weekly</div>
          </div>
        </div>

        {loading && (
          <div style={{ fontSize: 13, color: C.muted, padding: '12px 0', textAlign: 'center' }}>
            <span style={{ animation: 'pulse 1.5s infinite' }}>✨ Leva is analyzing your performance...</span>
          </div>
        )}

        {error && (
          <div style={{ fontSize: 13, color: C.danger, padding: '8px 0' }}>
            Analysis unavailable: {error}
          </div>
        )}

        {report && !loading && (
          <div style={{ position: 'relative' }}>
            {/* trend + best/worst */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <div style={{
                flex: 1, minWidth: 100, background: C.surface, borderRadius: 12, padding: '10px 14px',
                border: `1px solid ${C.border}`,
              }}>
                <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>4-Week Trend</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: trendColor[report.weeklyTrend] || C.text, marginTop: 2 }}>
                  {trendIcon[report.weeklyTrend] || '•'} {report.weeklyTrend}
                </div>
              </div>
              <div style={{
                flex: 1, minWidth: 100, background: C.surface, borderRadius: 12, padding: '10px 14px',
                border: `1px solid ${C.border}`,
              }}>
                <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Best Day</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.success, marginTop: 2 }}>🏆 {report.bestDay}</div>
              </div>
              <div style={{
                flex: 1, minWidth: 100, background: C.surface, borderRadius: 12, padding: '10px 14px',
                border: `1px solid ${C.border}`,
              }}>
                <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Needs Work</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.danger, marginTop: 2 }}>⚡ {report.worstDay}</div>
              </div>
            </div>

            {/* top category + struggling */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <div style={{
                flex: 1, background: C.surface, borderRadius: 12, padding: '10px 14px',
                border: `1px solid ${C.border}`,
              }}>
                <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Top Category</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.accent, marginTop: 4 }}>🥇 {report.topCategory}</div>
              </div>
              {report.strugglingWith?.length > 0 && (
                <div style={{
                  flex: 1, background: C.surface, borderRadius: 12, padding: '10px 14px',
                  border: `1px solid ${C.danger}33`,
                }}>
                  <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Struggling With</div>
                  <div style={{ fontSize: 13, color: C.danger, marginTop: 4 }}>
                    {report.strugglingWith.join(', ')}
                  </div>
                </div>
              )}
            </div>

            {/* suggestion */}
            {report.suggestion && (
              <div style={{
                background: C.accent + '0d', borderRadius: 12, padding: '12px 14px',
                border: `1px solid ${C.accent}22`, marginBottom: 12,
              }}>
                <div style={{ fontSize: 10, color: C.accent, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>💡 Leva's Tip</div>
                <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{report.suggestion}</div>
              </div>
            )}

            {/* motivational quote */}
            {report.motivationalQuote && (
              <div style={{
                borderLeft: `3px solid ${C.purple}`,
                paddingLeft: 14, fontStyle: 'italic', fontSize: 13,
                color: C.muted, lineHeight: 1.5,
              }}>
                "{report.motivationalQuote}"
              </div>
            )}
          </div>
        )}

        {!report && !loading && !error && tasks.length === 0 && (
          <div style={{ fontSize: 13, color: C.muted, textAlign: 'center', padding: '12px 0' }}>
            Add some tasks and Leva will analyze your patterns!
          </div>
        )}
      </div>

      {/* day rows */}
      {weekData.map(d => (
        <div key={d.date} style={{
          background: C.card,
          border: `1px solid ${d.isToday ? C.accent + '55' : C.border}`,
          borderRadius: 14, padding: '11px 14px', marginBottom: 8,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          {/* date badge */}
          <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: d.isToday ? C.accent + '18' : C.surface, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase' }}>{d.day}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: d.isToday ? C.accent : C.text }}>
              {new Date(d.date + 'T12:00:00').getDate()}
            </div>
          </div>

          {/* progress */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: C.text, marginBottom: 5 }}>{d.done}/{d.total} tasks completed</div>
            <div style={{ height: 5, background: C.surface, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: d.perf + '%', background: barColor(d), borderRadius: 3, transition: 'width .5s' }} />
            </div>
          </div>

          {/* perf % */}
          <div style={{ fontSize: 18, fontWeight: 700, color: barColor(d), flexShrink: 0 }}>
            {d.total > 0 ? d.perf + '%' : '—'}
          </div>
        </div>
      ))}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
