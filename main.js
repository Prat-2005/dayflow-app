import { app, BrowserWindow, Tray, Menu, Notification, ipcMain, nativeImage, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import Store from 'electron-store';
import schedule from 'node-schedule';
import AutoLaunch from 'auto-launch';

// ── Deep-link protocol for Supabase auth callbacks ───────────────────────────
// Register dayflow:// so magic-link emails redirect back into the desktop app.
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('dayflow', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('dayflow');
}

// ── Single-instance lock ─────────────────────────────────────────────────────
// CRITICAL: Without this, clicking a dayflow:// deep-link opens a SECOND window
// on Windows instead of forwarding the URL to the existing instance.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  // This is the second instance — just quit, the first instance handles it.
  app.quit();
}

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
      preload: path.join(__dirname, 'preload.cjs'),
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

  // Forward any deep-link URL that was passed at launch (Windows: second-instance doesn't fire)
  const launchUrl = process.argv.find(arg => arg.startsWith('dayflow://'));
  if (launchUrl) {
    mainWindow.webContents.once('did-finish-load', () => {
      mainWindow.webContents.send('auth-deep-link', launchUrl);
    });
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

// ── Deep-link handling ───────────────────────────────────────────────────────
// Windows: when user clicks dayflow:// link, OS launches a second Electron
// instance with the URL as a command-line arg. requestSingleInstanceLock()
// above makes that second instance quit immediately after emitting this event.
app.on('second-instance', (_event, commandLine) => {
  const url = commandLine.find(arg => arg.startsWith('dayflow://'));
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
    if (url) {
      console.log('[Deep-link] second-instance URL:', url);
      mainWindow.webContents.send('auth-deep-link', url);
    }
  }
});

// macOS: deep-link fires as an open-url event on the existing instance.
app.on('open-url', (event, url) => {
  event.preventDefault();
  console.log('[Deep-link] open-url:', url);
  if (mainWindow) {
    mainWindow.webContents.send('auth-deep-link', url);
  }
});
