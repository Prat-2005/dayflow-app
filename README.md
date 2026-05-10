# DayFlow — Daily To-Do Tracker

> **Deep Space Neon** • React • Claude AI (Leva) • localStorage

A personal productivity tracker with an AI companion named **Leva** who monitors
your daily task performance, motivates you, and asks why when things dip.

---

## Quick Start (Web)

```bash
npm create vite@latest dayflow -- --template react
cd dayflow
npm install recharts
# Copy the src/ folder from this scaffold into the project
npm run dev
```

**Required env variable:**
The Claude API key is handled automatically when running inside Claude's artifact
system. For a standalone deployment, add a proxy or pass the key via environment:
```
VITE_ANTHROPIC_API_KEY=sk-ant-...
```
Then update `src/utils/levaAI.js` to read `import.meta.env.VITE_ANTHROPIC_API_KEY`.

---

## Module Map

| File | Responsibility |
|------|---------------|
| `constants/theme.js` | All colors, fonts, categories — single source of truth |
| `utils/helpers.js` | Pure date/math functions — no side effects |
| `utils/storage.js` | localStorage wrapper — swap for AsyncStorage / electron-store |
| `utils/levaAI.js` | Claude API call + system prompt — swap LLM here only |
| `hooks/useTasks.js` | Task CRUD + persistence |
| `hooks/useLeva.js` | Chat state + AI calls |
| `components/` | Pure presentational components |
| `views/` | Page-level compositions |
| `App.jsx` | Root: layout, nav, state orchestration |

---

## Extending the App

See **PROMPT.md** for copy-paste AI prompts covering:
1. Email reports (Resend / SendGrid backend)
2. React Native / Expo mobile app
3. Electron desktop wrapper
4. PWA + push notifications
5. Deeper Leva performance insights
6. Supabase cross-device sync

---

## Tech Stack

- **React 18** + Vite
- **recharts** — weekly bar chart
- **Anthropic Claude API** — Leva's intelligence
- **localStorage** — zero-backend persistence (swap-ready)
- **Space Grotesk** — Google Font
