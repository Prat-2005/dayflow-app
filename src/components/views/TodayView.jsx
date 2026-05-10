import { C } from '../constants/theme'
import { TaskItem }   from '../components/TaskItem'
import { AddTaskForm } from '../components/AddTaskForm'

const StatCard = ({ label, value, color }) => (
  <div style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '11px 10px', textAlign: 'center' }}>
    <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{label}</div>
  </div>
)

export function TodayView({ todayTasks, todayDone, todayPerf, onToggle, onEdit, onDelete, onAdd }) {
  const pending = todayTasks.length - todayDone

  return (
    <>
      {/* Stats row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <StatCard label="Done"     value={todayDone}      color={C.success} />
        <StatCard label="Pending"  value={pending}        color={C.warning} />
        <StatCard label="Accuracy" value={todayPerf + '%'} color={C.accent}  />
      </div>

      {/* Empty state */}
      {todayTasks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: C.muted }}>
          <div style={{ fontSize: 42, marginBottom: 10 }}>📋</div>
          <div style={{ fontSize: 15 }}>No tasks yet!</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Tap + below to add your first task.</div>
        </div>
      )}

      {/* Task list */}
      {todayTasks.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}

      {/* Add task */}
      <AddTaskForm onAdd={onAdd} />
    </>
  )
}
