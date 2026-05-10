// ─── useLeva — chat state + API calls ─────────────────────────────────────
import { useState, useRef, useEffect } from 'react'
import { askLeva } from '../utils/levaAI'

const INITIAL_MSG = {
  role: 'assistant',
  content: "Hey! I'm Leva, your daily companion 🌟 Let's crush those tasks together! How are you feeling today?",
}

export function useLeva(contextPayload) {
  const [messages, setMessages] = useState([INITIAL_MSG])
  const [loading, setLoading]   = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text) => {
    const message = (text ?? '').trim()
    if (!message || loading) return

    setMessages(prev => [...prev, { role: 'user', content: message }])
    setLoading(true)

    try {
      const history = messages.slice(-8).map(m => ({ role: m.role, content: m.content }))
      const reply = await askLeva(message, history, contextPayload)
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "My connection hiccupped! But I believe in you — keep going! 💪",
      }])
    }

    setLoading(false)
  }

  return { messages, loading, send, chatEndRef }
}
