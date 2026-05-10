// ─── Date Utilities ─────────────────────────────────────────────────────────

/** Returns today's date as YYYY-MM-DD */
export const todayStr = () => new Date().toISOString().split('T')[0]

/** Returns the short weekday name (Mon, Tue…) for a YYYY-MM-DD string */
export const dayOfWeek = (dateStr) =>
  new Date(dateStr + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' })

/** Returns the date number (1–31) for a YYYY-MM-DD string */
export const dayNumber = (dateStr) =>
  new Date(dateStr + 'T12:00:00').getDate()

/** Returns the last 7 days as YYYY-MM-DD strings, oldest first */
export const getLast7Days = () =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })

/** Returns the last N days of a given month as YYYY-MM-DD strings */
export const getDaysInMonth = (year, month) => {
  const days = []
  const total = new Date(year, month + 1, 0).getDate()
  for (let i = 1; i <= total; i++) {
    days.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`)
  }
  return days
}

/** Human-friendly date: "Apr 26" */
export const friendlyDate = (dateStr) =>
  new Date(dateStr + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })
