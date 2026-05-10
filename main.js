import { app, BrowserWindow, Tray, Menu, Notification, ipcMain, nativeImage } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import Store from 'electron-store';
import schedule from 'node-schedule';
import AutoLaunch from 'auto-launch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const store = new Store();
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let tray;
let isMiniMode = false;

// App icon path — used for both window and tray
const APP_ICON_PATH = path.join(__dirname, 'public', 'icon-512.png');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 400,
    minHeight: 500,
    icon: APP_ICON_PATH,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

function toggleMiniMode() {
  if (!mainWindow) return;

  isMiniMode = !isMiniMode;

  if (isMiniMode) {
    mainWindow.setSize(280, 400);
    mainWindow.setAlwaysOnTop(true);
  } else {
    mainWindow.setSize(900, 700);
    mainWindow.setAlwaysOnTop(false);
  }
}

function updateTrayBadge() {
  if (!tray) return;
  const tasks = store.get('dayflow-tasks') || [];
  const pendingCount = tasks.filter(t => !t.completed).length;
  
  if (process.platform === 'darwin') {
    app.dock.setBadge(pendingCount > 0 ? pendingCount.toString() : '');
    tray.setTitle(pendingCount > 0 ? pendingCount.toString() : '');
  } else if (process.platform === 'win32') {
    tray.setToolTip(`DayFlow - ${pendingCount} pending tasks`);
  }
}

function scheduleNotifications() {
  // 9:00 AM
  schedule.scheduleJob('0 9 * * *', () => {
    const tasks = store.get('dayflow-tasks') || [];
    const totalCount = tasks.length;
    new Notification({
      title: 'DayFlow',
      body: `Good morning! You have ${totalCount} tasks today.`
    }).show();
  });

  // 6:00 PM
  schedule.scheduleJob('0 18 * * *', () => {
    const tasks = store.get('dayflow-tasks') || [];
    const pendingCount = tasks.filter(t => !t.completed).length;
    
    if (pendingCount > 0) {
      new Notification({
        title: 'DayFlow',
        body: `You have ${pendingCount} pending tasks — quick check in?`
      }).show();
    }
  });
}

function setupAutoLaunch() {
  const dayflowAutoLauncher = new AutoLaunch({
    name: 'DayFlow',
    path: app.getPath('exe'),
  });

  dayflowAutoLauncher.isEnabled().then((isEnabled) => {
    if (!isEnabled) dayflowAutoLauncher.enable();
  }).catch((err) => {
    console.error('AutoLaunch error:', err);
  });
}

app.whenReady().then(() => {
  // IPC for Store
  ipcMain.on('store-get', (event, key) => {
    event.returnValue = store.get(key);
  });
  
  ipcMain.on('store-set', (event, key, val) => {
    store.set(key, val);
    updateTrayBadge();
  });
  
  ipcMain.on('store-delete', (event, key) => {
    store.delete(key);
    updateTrayBadge();
  });

  createWindow();
  scheduleNotifications();

  if (!isDev) {
    setupAutoLaunch();
  }

  // Tray setup
  const trayIcon = nativeImage.createFromPath(APP_ICON_PATH).resize({ width: 16, height: 16 });
  tray = new Tray(trayIcon);
  tray.setToolTip('DayFlow');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Toggle Mini Mode', click: toggleMiniMode },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]);
  
  tray.setContextMenu(contextMenu);
  tray.on('click', toggleMiniMode);

  updateTrayBadge();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
