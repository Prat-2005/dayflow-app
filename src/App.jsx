// ─── App.jsx — root component, layout & state orchestration ───────────────
import React, { useState, useEffect } from 'react'
import { C, FONT } from './constants/theme'
import { todayStr, calcWeekAcc, calcDayPerf, perfToMood } from './utils/helpers'
import { storage } from './utils/storage'
import { useAuth } from './hooks/useAuth'
import { useTasks } from './hooks/useTasks'
import { migrateLocalTasks, getProfile, updateProfile } from './utils/supabaseStorage'
import { Stars } from './components/Stars'
import { LevaAvatar } from './components/LevaAvatar'
import { LevaChat } from './components/LevaChat'
import { TodayView } from './views/TodayView'
import { WeeklyView } from './views/WeeklyView'
import { SettingsView } from './views/SettingsView'

const NAV = [
  { id: 'today', label: 'Today' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'settings', label: 'Settings' },
]

export default function App() {
  const [view, setView] = useState('today')
  const [userName, setUserName] = useState(storage.getName())
  const [userEmail, setUserEmail] = useState(storage.getEmail())
  
  useEffect(() => {
    console.log('[App] Electron API present:', !!window.electronAPI)
  }, [])

  // Auth state
  const { user, loading: authLoading, signInWithEmail, signOut } = useAuth()

  // Tasks — pass user so it knows whether to use Supabase or localStorage
  const { tasks, addTask, toggleTask, updateTask, deleteTask, clearAll, syncing } = useTasks(user)

  // On sign-in: migrate local tasks to Supabase and load profile
  useEffect(() => {
    if (!user) return

    async function onSignIn() {
      // Migrate any local tasks to the cloud
      await migrateLocalTasks(user.id)

      // Load profile from Supabase
      const profile = await getProfile(user.id)
      if (profile) {
        if (profile.name && profile.name !== 'Friend') {
          setUserName(profile.name)
          storage.setName(profile.name)
        }
        if (profile.email) {
          setUserEmail(profile.email)
          storage.setEmail(profile.email)
        }
      }

      // If user had a local name, push it to Supabase
      const localName = storage.getName()
      if (localName && localName !== 'Friend' && (!profile?.name || profile.name === 'Friend')) {
        await updateProfile(user.id, { name: localName })
      }
    }

    onSignIn()
  }, [user?.id])

  // Sync name/email changes to Supabase profile
  const handleSetUserName = (name) => {
    setUserName(name)
    storage.setName(name)
    if (user) updateProfile(user.id, { name })
  }

  const handleSetUserEmail = (email) => {
    setUserEmail(email)
    storage.setEmail(email)
  }

  const today = todayStr()
  const todayTasks = tasks.filter(t => t.date === today)
  const todayDone = todayTasks.filter(t => t.completed).length
  const todayPerf = todayTasks.length ? Math.round((todayDone / todayTasks.length) * 100) : -1
  const weekAcc = calcWeekAcc(tasks)
  const levaMood = perfToMood(todayPerf)

  // Context payload fed to Leva's AI prompt
  const levaContext = {
    userName,
    todayDone,
    todayTotal: todayTasks.length,
    todayPerf: todayPerf < 0 ? 0 : todayPerf,
    weekAcc,
    taskList: todayTasks.map(t => `${t.text} (${t.category}) [${t.completed ? 'done' : 'pending'}]`).join('; '),
  }

  const accColor = weekAcc >= 70 ? C.success : weekAcc >= 40 ? C.warning : C.danger

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: FONT, position: 'relative' }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <Stars />

      {/* ── Page container (dynamic desktop layout) ── */}
      <div style={{ width: '100%', margin: '0 auto', position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div style={{
          background: C.surface + 'd9', backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${C.border}`, padding: '20px 30px',
          position: 'sticky', top: 0, zIndex: 10,
          marginBottom: 10, boxShadow: `0 4px 30px ${C.bg}88`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.accent, letterSpacing: '-0.5px' }}>DayFlow</div>
              <div style={{ fontSize: 11, color: C.muted }}>
                {new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Sync indicator */}
              {user && (
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: syncing ? C.warning : C.success,
                  boxShadow: `0 0 6px ${syncing ? C.warning : C.success}`,
                  transition: 'background .3s, box-shadow .3s',
                }} title={syncing ? 'Syncing...' : 'Synced'} />
              )}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '5px 12px', fontSize: 12 }}>
                <span style={{ color: accColor, fontWeight: 700 }}>{weekAcc}%</span>
                <span style={{ color: C.muted }}> this week</span>
              </div>
              <LevaAvatar mood={levaMood} size={42} glow />
            </div>
          </div>

          {/* nav tabs */}
          <div style={{ display: 'flex', gap: 4 }}>
            {NAV.map(({ id, label }) => (
              <button key={id} onClick={() => setView(id)} style={{
                flex: 1, padding: '7px 4px', borderRadius: 9, border: 'none',
                cursor: 'pointer', fontFamily: FONT, fontWeight: 600, fontSize: 12,
                background: view === id ? C.accent : 'transparent',
                color: view === id ? C.bg : C.muted,
                transition: 'background .15s, color .15s',
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Main content ────────────────────────────────────────────── */}
        <div style={{ padding: '20px 30px', paddingBottom: 110, flex: 1 }}>
          {view === 'today' && (
            <TodayView
              tasks={todayTasks}
              onAdd={addTask} onToggle={toggleTask}
              onUpdate={updateTask} onDelete={deleteTask}
            />
          )}
          {view === 'weekly' && <WeeklyView tasks={tasks} userName={userName} />}
          {view === 'settings' && (
            <SettingsView
              tasks={tasks}
              userName={userName} setUserName={handleSetUserName}
              userEmail={userEmail} setUserEmail={handleSetUserEmail}
              onClearAll={clearAll}
              user={user}
              onSignIn={signInWithEmail}
              onSignOut={signOut}
              syncing={syncing}
            />
          )}
        </div>
      </div>

      {/* ── Leva floating chat ──────────────────────────────────────── */}
      <LevaChat mood={levaMood} contextPayload={levaContext} />

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; overflow-x: hidden; }
        input::placeholder { color: ${C.muted}; }
        select option { background: ${C.surface}; color: ${C.text}; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  )
}
