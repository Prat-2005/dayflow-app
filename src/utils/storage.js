// ─── LocalStorage abstraction ──────────────────────────────────────────────
// Swap this module for AsyncStorage on React Native,
// or for electron-store on Electron desktop.

const KEYS = {
  TASKS: 'dayflow-tasks',
  NAME:  'dayflow-name',
  EMAIL: 'dayflow-email',
}

const isElectron = window.electronAPI !== undefined;

export const storage = {
  getTasks:   ()  => {
    try {
      if (isElectron) return window.electronAPI.storeGet(KEYS.TASKS) || [];
      return JSON.parse(localStorage.getItem(KEYS.TASKS) || '[]')
    } catch { return [] }
  },
  setTasks:   (t) => {
    try {
      if (isElectron) window.electronAPI.storeSet(KEYS.TASKS, t);
      else localStorage.setItem(KEYS.TASKS, JSON.stringify(t))
    } catch {}
  },
  clearTasks: ()  => {
    if (isElectron) window.electronAPI.storeDelete(KEYS.TASKS);
    else localStorage.removeItem(KEYS.TASKS);
  },

  getName:  ()  => {
    if (isElectron) return window.electronAPI.storeGet(KEYS.NAME) || 'Friend';
    return localStorage.getItem(KEYS.NAME) || 'Friend';
  },
  setName:  (n) => {
    if (isElectron) window.electronAPI.storeSet(KEYS.NAME, n);
    else localStorage.setItem(KEYS.NAME, n);
  },

  getEmail: ()  => {
    if (isElectron) return window.electronAPI.storeGet(KEYS.EMAIL) || '';
    return localStorage.getItem(KEYS.EMAIL) || '';
  },
  setEmail: (e) => {
    if (isElectron) window.electronAPI.storeSet(KEYS.EMAIL, e);
    else localStorage.setItem(KEYS.EMAIL, e);
  },
}
