// ─── Electron Preload Script ────────────────────────────────────────────────
// IMPORTANT: This file uses CommonJS (require) and .cjs extension because
// Electron's sandboxed renderer context does not support ESM imports in preload
// scripts. This is required for IPC (Inter-Process Communication) to work.

const { contextBridge, ipcRenderer } = require('electron');

console.log('[Preload] Bridge script loading...');

contextBridge.exposeInMainWorld('electronAPI', {
  storeGet: (key) => ipcRenderer.sendSync('store-get', key),
  storeSet: (key, val) => ipcRenderer.send('store-set', key, val),
  storeDelete: (key) => ipcRenderer.send('store-delete', key),
  // Listener for magic-link deep links
  onAuthDeepLink: (callback) => {
    console.log('[Preload] Deep-link listener attached ✓');
    ipcRenderer.on('auth-deep-link', (_event, url) => {
      console.log('[Preload] Received IPC auth-deep-link, forwarding to React...');
      callback(url);
    });
  },
});

console.log('[Preload] Bridge script exposed to window.electronAPI ✓');
