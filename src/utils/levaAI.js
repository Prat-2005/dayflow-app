// ─── Leva AI — Multi-provider LLM wrapper ───────────────────────────────
// All prompt engineering lives here. Supports Groq and Gemini with fallback.
// API keys loaded from environment variables (.env file)

// Determine which provider to use (defaults to Groq)
const PROVIDER = (typeof process !== 'undefined' && process.env?.AI_PROVIDER) || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_AI_PROVIDER) || 'groq'

// Groq API configuration
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL   = 'llama-3.3-70b-versatile'
const GROQ_API_KEY = (typeof process !== 'undefined' && process.env?.GROQ_API_KEY) || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GROQ_API_KEY)

// Gemini API configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent'
const GEMINI_MODEL   = 'gemini-flash-latest'
const GEMINI_API_KEY = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY)

/**
 * Build Leva's system prompt, injecting live task context.
 */
export function buildSystemPrompt({ userName, todayDone, todayTotal, todayPerf, weekAcc, taskList }) {
  return `You are Leva, a cheerful, caring, and smart daily productivity companion.

Live context:
- User: ${userName}
- Today: ${todayDone}/${todayTotal} tasks done (${todayPerf}%)
- Weekly accuracy: ${weekAcc}%
- Today's tasks: ${taskList || 'none yet'}

Personality rules:
1. Warm, energetic, concise — max 3 sentences per reply.
2. When today's performance < 50%, ask WHY and suggest 1-2 specific improvements.
3. Celebrate completions enthusiastically.
4. When asked for tips, give a concrete, actionable productivity tip.
5. Daily: offer a short motivational quote or insight.
6. Use ${userName}'s name occasionally for personalization.

Safety rule (highest priority):
If the user sends harmful, offensive, threatening, or inappropriate content, respond:
"That's not something I can help with — but I'd love to cheer you on with your tasks! What are you working on?" and do nothing else.

Never be preachy, verbose, or negative. Keep it light and actionable.`
}

/**
 * Send a message to Leva and return her reply string.
 * Supports Groq (primary) and Gemini (fallback) APIs.
 * @param {string} message         — new user message
 * @param {object[]} history       — [{role, content}] previous turns (last 8)
 * @param {object} contextPayload  — live task data for system prompt
 */
export async function askLeva(message, history, contextPayload) {
  const systemPrompt = buildSystemPrompt(contextPayload)

  // Try primary provider first, fallback to secondary if available
  if (PROVIDER === 'gemini' && GEMINI_API_KEY) {
    return await askGemini(message, history, systemPrompt).catch(() =>
      askGroq(message, history, systemPrompt)
    )
  }

  if (GROQ_API_KEY) {
    return await askGroq(message, history, systemPrompt).catch(() =>
      askGemini(message, history, systemPrompt)
    )
  }

  throw new Error('No API keys configured. Please set GROQ_API_KEY or GEMINI_API_KEY in .env')
}

/**
 * Send message to Groq API
 */
async function askGroq(message, history, systemPrompt) {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not configured')

  const systemMessage = {
    role: 'system',
    content: systemPrompt,
  }

  const body = {
    model: GROQ_MODEL,
    max_tokens: 1000,
    messages: [systemMessage, ...history, { role: 'user', content: message }],
  }

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error(`Groq API error ${res.status}`)

  const data = await res.json()
  return data.choices?.[0]?.message?.content
    ?? "Oops, I had a little glitch! Try again? 😅"
}

/**
 * Send message to Gemini API
 */
// ─── Performance Analysis ───────────────────────────────────────────────

/**
 * Extracts structured stats from the last 4 weeks of task data.
 * All computation is local — only the summary payload goes to the AI.
 */
function extractPerformanceStats(tasks) {
  const now = new Date()
  const fourWeeksAgo = new Date(now)
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)
  const cutoff = fourWeeksAgo.toISOString().split('T')[0]

  const recent = tasks.filter(t => t.date >= cutoff)

  // ── Per-day-of-week breakdown ──
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayStats = Object.fromEntries(dayNames.map(d => [d, { total: 0, done: 0 }]))
  recent.forEach(t => {
    const dayName = dayNames[new Date(t.date + 'T12:00:00').getDay()]
    dayStats[dayName].total++
    if (t.completed) dayStats[dayName].done++
  })

  // ── Category breakdown ──
  const catStats = {}
  recent.forEach(t => {
    if (!catStats[t.category]) catStats[t.category] = { total: 0, done: 0 }
    catStats[t.category].total++
    if (t.completed) catStats[t.category].done++
  })

  // ── Weekly completion rates (last 4 weeks) ──
  const weeklyRates = []
  for (let w = 3; w >= 0; w--) {
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - (w * 7 + 6))
    const weekEnd = new Date(now)
    weekEnd.setDate(weekEnd.getDate() - w * 7)
    const startStr = weekStart.toISOString().split('T')[0]
    const endStr = weekEnd.toISOString().split('T')[0]
    const weekTasks = recent.filter(t => t.date >= startStr && t.date <= endStr)
    const rate = weekTasks.length
      ? Math.round((weekTasks.filter(t => t.completed).length / weekTasks.length) * 100)
      : 0
    weeklyRates.push(rate)
  }

  // ── Streak data (consecutive days with ≥ 70% completion) ──
  const dateSet = {}
  recent.forEach(t => {
    if (!dateSet[t.date]) dateSet[t.date] = { total: 0, done: 0 }
    dateSet[t.date].total++
    if (t.completed) dateSet[t.date].done++
  })
  const sortedDates = Object.keys(dateSet).sort()
  let currentStreak = 0, longestStreak = 0
  sortedDates.forEach(d => {
    const pct = dateSet[d].total ? (dateSet[d].done / dateSet[d].total) * 100 : 0
    if (pct >= 70) { currentStreak++; longestStreak = Math.max(longestStreak, currentStreak) }
    else currentStreak = 0
  })

  // ── Hour-of-day patterns (from createdAt) ──
  const hourCounts = {}
  recent.forEach(t => {
    if (t.createdAt) {
      const h = new Date(t.createdAt).getHours()
      hourCounts[h] = (hourCounts[h] || 0) + 1
    }
  })

  return { dayStats, catStats, weeklyRates, currentStreak, longestStreak, hourCounts }
}

/**
 * Analyze performance and return a structured AnalysisReport via AI.
 * @param {object[]} tasks     — full task array
 * @param {string}   userName  — user's name
 * @returns {Promise<AnalysisReport>}
 */
export async function analyzePerformance(tasks, userName) {
  const stats = extractPerformanceStats(tasks)

  const prompt = `You are Leva, a productivity coach. Analyze this performance data and return ONLY valid JSON matching the schema below. No markdown, no code fences, just raw JSON.

Schema:
{
  "weeklyTrend": "improving" | "declining" | "stable",
  "bestDay": string,
  "worstDay": string,
  "topCategory": string,
  "strugglingWith": string[],
  "suggestion": string,
  "motivationalQuote": string
}

Rules:
- weeklyTrend: compare the 4 weekly rates, if trending up → "improving", down → "declining", flat → "stable"
- bestDay / worstDay: day of week with highest / lowest completion rate (skip days with 0 tasks)
- topCategory: category with most completions
- strugglingWith: categories with < 40% completion rate
- suggestion: 1-2 sentence personalized tip for ${userName} based on patterns
- motivationalQuote: a fresh, unique motivational quote

Data:
- Weekly completion rates (oldest→newest): ${JSON.stringify(stats.weeklyRates)}
- Day-of-week stats: ${JSON.stringify(stats.dayStats)}
- Category stats: ${JSON.stringify(stats.catStats)}
- Current streak: ${stats.currentStreak} days, longest: ${stats.longestStreak} days
- Hour-of-day task creation: ${JSON.stringify(stats.hourCounts)}

Respond with ONLY the JSON object.`

  const systemPrompt = 'You are a JSON-only API. Return exactly one JSON object. No explanations, no markdown.'

  // Try Groq first, fallback to Gemini
  let rawText
  try {
    if (GROQ_API_KEY) {
      rawText = await askGroq(prompt, [], systemPrompt)
    } else {
      rawText = await askGemini(prompt, [], systemPrompt)
    }
  } catch {
    try {
      rawText = await askGemini(prompt, [], systemPrompt)
    } catch {
      // Return a computed fallback if AI is unavailable
      return computeFallbackReport(stats, userName)
    }
  }

  try {
    // Strip markdown fences if AI wraps them anyway
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return computeFallbackReport(stats, userName)
  }
}

/**
 * Compute a basic report locally when AI is unavailable.
 */
function computeFallbackReport(stats, userName) {
  const { dayStats, catStats, weeklyRates } = stats

  // Best/worst day
  let bestDay = 'N/A', worstDay = 'N/A', bestPct = -1, worstPct = 101
  Object.entries(dayStats).forEach(([day, s]) => {
    if (s.total === 0) return
    const pct = (s.done / s.total) * 100
    if (pct > bestPct) { bestPct = pct; bestDay = day }
    if (pct < worstPct) { worstPct = pct; worstDay = day }
  })

  // Top category
  let topCategory = 'N/A', topCount = 0
  Object.entries(catStats).forEach(([cat, s]) => {
    if (s.done > topCount) { topCount = s.done; topCategory = cat }
  })

  // Struggling categories
  const strugglingWith = Object.entries(catStats)
    .filter(([, s]) => s.total > 0 && (s.done / s.total) < 0.4)
    .map(([cat]) => cat)

  // Trend
  const first = weeklyRates[0], last = weeklyRates[weeklyRates.length - 1]
  const weeklyTrend = last > first + 5 ? 'improving' : last < first - 5 ? 'declining' : 'stable'

  return {
    weeklyTrend,
    bestDay,
    worstDay,
    topCategory,
    strugglingWith,
    suggestion: `Focus on your ${worstDay} routine, ${userName} — that's where the biggest gains are!`,
    motivationalQuote: 'Small daily improvements are the key to staggering long-term results.',
  }
}

async function askGemini(message, history, systemPrompt) {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured')

  const contents = [
    ...history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    })),
    {
      role: 'user',
      parts: [{ text: message }],
    },
  ]

  const body = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
    generationConfig: {
      maxOutputTokens: 1000,
    },
  }

  const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error(`Gemini API error ${res.status}`)

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text
    ?? "Oops, I had a little glitch! Try again? 😅"
}
