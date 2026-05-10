// ─── useTasks — task state + CRUD, with Supabase cloud sync ───────────────
import { useState, useEffect, useCallback, useRef } from 'react'
import { storage } from '../utils/storage'
import { todayStr } from '../utils/helpers'
import * as supa from '../utils/supabaseStorage'

export function useTasks(user) {
  const [tasks, setTasks]   = useState([])
  const [loaded, setLoaded] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const unsubRef = useRef(null)

  const userId = user?.id ?? null

  // ── Load tasks on mount or when auth changes ──────────────────────────
  useEffect(() => {
    let cancelled = false

    async function loadTasks() {
      if (userId) {
        // Signed in: fetch from Supabase (falls back to local cache)
        setSyncing(true)
        const cloudTasks = await supa.getTasks(userId)
        if (!cancelled) {
          setTasks(cloudTasks)
          setLoaded(true)
          setSyncing(false)
        }
      } else {
        // Not signed in: use localStorage
        setTasks(storage.getTasks())
        setLoaded(true)
      }
    }

    loadTasks()
    return () => { cancelled = true }
  }, [userId])

  // ── Realtime subscription when signed in ──────────────────────────────
  useEffect(() => {
    if (!userId) return

    // Re-fetch tasks when realtime notifies us of a change
    const unsub = supa.subscribeToTasks(userId, async () => {
      const refreshed = await supa.getTasks(userId)
      setTasks(refreshed)
    })

    unsubRef.current = unsub
    return () => { if (unsubRef.current) unsubRef.current() }
  }, [userId])

  // ── Persist locally when not signed in ────────────────────────────────
  useEffect(() => {
    if (loaded && !userId) {
      storage.setTasks(tasks)
    }
  }, [tasks, loaded, userId])

  // ── CRUD ──────────────────────────────────────────────────────────────

  const addTask = useCallback(async ({ text, category }) => {
    if (!text?.trim()) return

    const newTask = {
      id:        crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      text:      text.trim(),
      category:  category || 'Personal',
      date:      todayStr(),
      completed: false,
      createdAt: new Date().toISOString(),
    }

    // Optimistic update
    setTasks(prev => [...prev, newTask])

    if (userId) {
      await supa.addTask(userId, newTask)
    }
  }, [userId])

  const toggleTask = useCallback(async (id) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return

    const newCompleted = !task.completed
    // Optimistic
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: newCompleted } : t))

    if (userId) {
      await supa.updateTask(userId, id, { completed: newCompleted })
    }
  }, [userId, tasks])

  const updateTask = useCallback(async (id, changes) => {
    // Optimistic
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...changes } : t))

    if (userId) {
      await supa.updateTask(userId, id, changes)
    }
  }, [userId])

  const deleteTask = useCallback(async (id) => {
    // Optimistic
    setTasks(prev => prev.filter(t => t.id !== id))

    if (userId) {
      await supa.deleteTask(userId, id)
    }
  }, [userId])

  const clearAll = useCallback(async () => {
    setTasks([])
    storage.clearTasks()

    if (userId) {
      await supa.clearAllTasks(userId)
    }
  }, [userId])

  return { tasks, addTask, toggleTask, updateTask, deleteTask, clearAll, syncing }
}
