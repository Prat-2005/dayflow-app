// ─── Date & performance helpers ────────────────────────────────────────────

export const todayStr = () => new Date().toISOString().split('T')[0]

export function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
}

export function calcWeekAcc(tasks) {
  const days = getLast7Days()
  const wk = tasks.filter(t => days.includes(t.date))
  if (!wk.length) return 0
  return Math.round((wk.filter(t => t.completed).length / wk.length) * 100)
}

/** Returns 0-100 or -1 if no tasks that day */
export function calcDayPerf(tasks, dateStr) {
  const dt = tasks.filter(t => t.date === dateStr)
  if (!dt.length) return -1
  return Math.round((dt.filter(t => t.completed).length / dt.length) * 100)
}

export function buildWeekData(tasks) {
  const today = todayStr()
  return getLast7Days().map(d => {
    const dt = tasks.filter(t => t.date === d)
    const done = dt.filter(t => t.completed).length
    return {
      day:     new Date(d + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' }),
      date:    d,
      total:   dt.length,
      done,
      perf:    dt.length ? Math.round((done / dt.length) * 100) : 0,
      isToday: d === today,
    }
  })
}

/** Map weekly accuracy → Leva's mood string */
export function perfToMood(perf) {
  if (perf < 0)  return 'neutral'
  if (perf >= 80) return 'excited'
  if (perf >= 45) return 'happy'
  return 'sad'
}
