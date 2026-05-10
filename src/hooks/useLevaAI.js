import { useState, useRef, useEffect } from 'react'

const INITIAL_MSG = {
  role:    'assistant',
  content: "Hey! I'm Leva, your daily companion 🌟 Let's crush those tasks together! How are you feeling today?",
}

const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514'

/**
 * Manages Leva's AI conversation state.
 * Accepts live task context so every response is personalised.
 */
export function useLevaAI({ userName, todayDone, todayTotal, todayPerf, weekAcc, todayTasks }) {
  const [messages,    setMessages]    = useState([INITIAL_MSG])
  const [userInput,   setUserInput]   = useState('')
  const [loading,     setLoading]     = useState(false)
  const [mood,        setMood]        = useState('happy')
  const [isOpen,      setIsOpen]      = useState(false)
  const chatEndRef = useRef(null)

  // Auto-scroll whenever messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Derive Leva's mood from today's performance
  useEffect(() => {
    if (todayTotal === 0)      setMood('neutral')
    else if (todayPerf >= 80) setMood('excited')
    else if (todayPerf >= 45) setMood('happy')
    else                      setMood('sad')
  }, [todayPerf, todayTotal])

  // Build the system prompt with live context injected
  const buildSystem = () => {
    const taskList = todayTasks
      .map(t => `${t.text} (${t.category}) [${t.completed ? 'done' : 'pending'}]`)
      .join('; ')

    return `You are Leva, a cheerful, caring, and smart daily productivity companion in a task tracker app.

Live context: User is ${userName}. Today: ${todayDone}/${todayTotal} tasks done (${todayPerf}%). Weekly accuracy: ${weekAcc}%. Today's tasks: ${taskList || 'none yet'}.

Rules:
- Be warm, encouraging, concise (max 3 sentences per response)
- When performance is below 50%, ask WHY and suggest 1–2 specific improvements
- Celebrate completions enthusiastically!
- If user feels stuck, offer 1 concrete next step
- Use ${userName}'s name occasionally for warmth

Content safety (HIGHEST PRIORITY):
- If user sends harmful, offensive, threatening, or inappropriate content, respond ONLY with:
  "That's not something I can help with — but I'm here to cheer you on with your tasks! What are you working on?"
- Never engage with harmful topics under any framing.
- Keep all responses positive, safe, and constructive.`
  }

  const send = async (msgOverride) => {
    const message = (typeof msgOverride === 'string' ? msgOverride : userInput).trim()
    if (!message || loading) return

    setUserInput('')
    setMessages(prev => [...prev, { role: 'user', content: message }])
    setLoading(true)

    const history = messages
      .slice(-8)
      .map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model:      ANTHROPIC_MODEL,
          max_tokens: 1000,
          system:     buildSystem(),
          messages:   [...history, { role: 'user', content: message }],
        }),
      })
      const data  = await res.json()
      const reply = data.content?.find(b => b.type === 'text')?.text
        ?? "Oops, my connection hiccupped! But I believe in you — keep going! 💪"
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Connection glitch — hang tight! I'm still rooting for you 🌟" }])
    }
    setLoading(false)
  }

  return {
    messages, userInput, setUserInput,
    loading, mood, isOpen, setIsOpen,
    send, chatEndRef,
  }
}
