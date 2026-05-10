// ─── Supabase Storage — cloud-synced task storage with offline fallback ────
import { supabase } from './supabaseClient'
import { storage as localStorage } from './storage'

/**
 * Supabase-backed storage layer.
 * - When signed in: reads/writes to Supabase, caches locally for offline.
 * - When signed out: falls back to localStorage only.
 */

// ── Task CRUD ───────────────────────────────────────────────────────────────

/**
 * Fetch all tasks for the signed-in user from Supabase.
 * Falls back to localStorage if offline or not signed in.
 */
export async function getTasks(userId) {
  if (!supabase || !userId) return localStorage.getTasks()

  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (error) throw error

    // Map Supabase row format → app format
    const tasks = data.map(mapFromSupabase)
    // Cache locally for offline access
    localStorage.setTasks(tasks)
    return tasks
  } catch (err) {
    console.warn('[SupabaseStorage] Fetch failed, using local cache:', err.message)
    return localStorage.getTasks()
  }
}

/**
 * Add a single task to Supabase.
 */
export async function addTask(userId, task) {
  // Always save locally first (optimistic)
  const localTasks = localStorage.getTasks()
  localTasks.push(task)
  localStorage.setTasks(localTasks)

  if (!supabase || !userId) return task

  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert(mapToSupabase(userId, task))
      .select()
      .single()

    if (error) throw error
    return mapFromSupabase(data)
  } catch (err) {
    console.warn('[SupabaseStorage] Insert failed:', err.message)
    return task
  }
}

/**
 * Update a task (toggle, edit, etc.).
 */
export async function updateTask(userId, taskId, changes) {
  // Optimistic local update
  const localTasks = localStorage.getTasks()
  const updated = localTasks.map(t => t.id === taskId ? { ...t, ...changes } : t)
  localStorage.setTasks(updated)

  if (!supabase || !userId) return

  try {
    const supaChanges = {}
    if ('completed' in changes) supaChanges.completed = changes.completed
    if ('text' in changes) supaChanges.text = changes.text
    if ('category' in changes) supaChanges.category = changes.category
    if ('date' in changes) supaChanges.date = changes.date

    const { error } = await supabase
      .from('tasks')
      .update(supaChanges)
      .eq('id', taskId)
      .eq('user_id', userId)

    if (error) throw error
  } catch (err) {
    console.warn('[SupabaseStorage] Update failed:', err.message)
  }
}

/**
 * Delete a task.
 */
export async function deleteTask(userId, taskId) {
  // Optimistic local delete
  const localTasks = localStorage.getTasks().filter(t => t.id !== taskId)
  localStorage.setTasks(localTasks)

  if (!supabase || !userId) return

  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId)

    if (error) throw error
  } catch (err) {
    console.warn('[SupabaseStorage] Delete failed:', err.message)
  }
}

/**
 * Delete all tasks for the user.
 */
export async function clearAllTasks(userId) {
  localStorage.clearTasks()

  if (!supabase || !userId) return

  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('user_id', userId)

    if (error) throw error
  } catch (err) {
    console.warn('[SupabaseStorage] Clear failed:', err.message)
  }
}

// ── Profile ─────────────────────────────────────────────────────────────────

export async function getProfile(userId) {
  if (!supabase || !userId) return null

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.warn('[SupabaseStorage] Profile fetch failed:', err.message)
    return null
  }
}

export async function updateProfile(userId, changes) {
  if (!supabase || !userId) return

  try {
    const { error } = await supabase
      .from('profiles')
      .update(changes)
      .eq('id', userId)

    if (error) throw error
  } catch (err) {
    console.warn('[SupabaseStorage] Profile update failed:', err.message)
  }
}

// ── Migration: push localStorage tasks to Supabase on first sign-in ─────────

export async function migrateLocalTasks(userId) {
  if (!supabase || !userId) return 0

  const localTasks = localStorage.getTasks()
  if (localTasks.length === 0) return 0

  try {
    const rows = localTasks.map(t => mapToSupabase(userId, t))

    const { error } = await supabase
      .from('tasks')
      .upsert(rows, { onConflict: 'id', ignoreDuplicates: true })

    if (error) throw error

    console.log(`[SupabaseStorage] Migrated ${localTasks.length} local tasks to cloud`)
    return localTasks.length
  } catch (err) {
    console.warn('[SupabaseStorage] Migration failed:', err.message)
    return 0
  }
}

// ── Realtime subscription ───────────────────────────────────────────────────

/**
 * Subscribe to realtime changes on the tasks table for a user.
 * Returns an unsubscribe function.
 */
export function subscribeToTasks(userId, onUpdate) {
  if (!supabase || !userId) return () => {}

  const channel = supabase
    .channel('tasks-realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('[Realtime] Task change:', payload.eventType)
        // Re-fetch all tasks on any change for simplicity
        onUpdate()
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

// ── Helpers: map between app format ↔ Supabase row format ───────────────────

function mapFromSupabase(row) {
  return {
    id: row.id,
    text: row.text,
    category: row.category,
    date: row.date, // already YYYY-MM-DD from Supabase date column
    completed: row.completed,
    createdAt: row.created_at,
  }
}

function mapToSupabase(userId, task) {
  return {
    id: task.id,
    user_id: userId,
    text: task.text,
    category: task.category || 'Personal',
    date: task.date,
    completed: task.completed || false,
    created_at: task.createdAt || new Date().toISOString(),
  }
}
