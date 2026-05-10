import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  storeGet: (key) => ipcRenderer.sendSync('store-get', key),
  storeSet: (key, val) => ipcRenderer.send('store-set', key, val),
  storeDelete: (key) => ipcRenderer.send('store-delete', key)
});
