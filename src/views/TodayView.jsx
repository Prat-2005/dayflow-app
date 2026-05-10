// ─── TodayView ────────────────────────────────────────────────────────────
import React, { useState } from 'react'
import { C } from '../constants/theme'
import { StatsRow } from '../components/StatsRow'
import { TaskItem } from '../components/TaskItem'
import { AddTaskForm } from '../components/AddTaskForm'

export function TodayView({ tasks, onAdd, onToggle, onUpdate, onDelete }) {
  const [adding, setAdding] = useState(false)
  const done    = tasks.filter(t => t.completed).length
  const pending = tasks.length - done
  const acc     = tasks.length ? Math.round((done / tasks.length) * 100) : 0

  return (
    <div>
      <StatsRow done={done} pending={pending} accuracy={acc} />

      {tasks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: C.muted }}>
          <div style={{ fontSize: 42, marginBottom: 10 }}>📋</div>
          <div style={{ fontSize: 15 }}>No tasks yet!</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Tap + below to add your first task.</div>
        </div>
      )}

      {tasks.map(task => (
        <TaskItem key={task.id} task={task}
          onToggle={onToggle} onUpdate={onUpdate} onDelete={onDelete} />
      ))}

      {adding ? (
        <AddTaskForm
          onAdd={t => { onAdd(t); setAdding(false) }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button onClick={() => setAdding(true)} style={{
          width: '100%', marginTop: 8, padding: 12,
          borderRadius: 14, border: `1.5px dashed ${C.border}`,
          background: 'transparent', color: C.muted, cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          + Add Task
        </button>
      )}
    </div>
  )
}
