import { createNote, deleteNote, getNotes, readNote, writeNote } from '@/lib'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { CreateNote, DeleteNote, GetNotes, ReadNote, WriteNote } from '@shared/types'
import { BrowserWindow, app, ipcMain, shell, autoUpdater, dialog } from 'electron'
import { join } from 'path'
import icon from '../../resources/icon.png?asset'

let mainWindow: BrowserWindow | null = null

// Auto-updater configuration
function setupAutoUpdater() {
  if (is.dev) return // Don't check for updates in dev mode

  const server = 'https://github.com/uvenkatateja/Notes'
  const url = `${server}/releases/latest`

  autoUpdater.setFeedURL({ url })

  // Check for updates every hour
  setInterval(() => {
    autoUpdater.checkForUpdates()
  }, 60 * 60 * 1000)

  // Check for updates on startup
  autoUpdater.checkForUpdates()

  // Auto-updater events
  autoUpdater.on('update-downloaded', (_event, releaseNotes, releaseName) => {
    const dialogOpts = {
      type: 'info',
      buttons: ['Restart', 'Later'],
      title: 'Application Update',
      message: process.platform === 'win32' ? releaseNotes : releaseName,
      detail: 'A new version has been downloaded. Restart the application to apply the updates.'
    }

    dialog.showMessageBox(dialogOpts).then((returnValue) => {
      if (returnValue.response === 0) autoUpdater.quitAndInstall()
    })
  })

  autoUpdater.on('error', (message) => {
    console.error('There was a problem updating the application')
    console.error(message)
  })

  // Optional: Send status to renderer
  autoUpdater.on('checking-for-update', () => {
    mainWindow?.webContents.send('update-status', 'Checking for update...')
  })
  autoUpdater.on('update-available', () => {
    mainWindow?.webContents.send('update-status', 'Update available.')
  })
  autoUpdater.on('update-not-available', () => {
    mainWindow?.webContents.send('update-status', 'Update not available.')
  })
  autoUpdater.on('download-progress', (progressObj) => {
    mainWindow?.webContents.send('update-status', `Downloading... ${progressObj.percent}%`)
  })
}

// Set up IPC handlers
function setupIpcHandlers() {
  // Window control handlers
  ipcMain.removeHandler('window-is-maximized')
  ipcMain.removeAllListeners('window-minimize')
  ipcMain.removeAllListeners('window-maximize')
  ipcMain.removeAllListeners('window-close')

  ipcMain.on('window-minimize', () => {
    if (!mainWindow?.isDestroyed()) {
      mainWindow?.minimize()
    }
  })

  ipcMain.on('window-maximize', () => {
    if (!mainWindow?.isDestroyed()) {
      if (mainWindow?.isMaximized()) {
        mainWindow?.restore()
      } else {
        mainWindow?.maximize()
      }
    }
  })

  ipcMain.on('window-close', () => {
    if (!mainWindow?.isDestroyed()) {
      mainWindow?.close()
    }
  })

  ipcMain.handle('window-is-maximized', () => {
    if (!mainWindow?.isDestroyed()) {
      return mainWindow?.isMaximized() || false
    }
    return false
  })

  // Note handlers
  ipcMain.handle('getNotes', (_, ...args: Parameters<GetNotes>) => getNotes(...args))
  ipcMain.handle('readNote', (_, ...args: Parameters<ReadNote>) => readNote(...args))
  ipcMain.handle('writeNote', (_, ...args: Parameters<WriteNote>) => writeNote(...args))
  ipcMain.handle('createNote', (_, ...args: Parameters<CreateNote>) => createNote(...args))
  ipcMain.handle('deleteNote', (_, ...args: Parameters<DeleteNote>) => deleteNote(...args))

  // Update checker
  ipcMain.handle('check-for-updates', () => {
    if (!is.dev) {
      autoUpdater.checkForUpdates()
    }
  })
}

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    center: true,
    title: 'NoteMark',
    frame: false,
    vibrancy: 'under-window',
    visualEffectState: 'active',
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 15, y: 10 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow?.isDestroyed()) {
      mainWindow?.show()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Set up IPC handlers before creating window
  setupIpcHandlers()
  createWindow()
  setupAutoUpdater() // Initialize auto-updater

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      setupIpcHandlers() // Re-setup handlers for new window
      createWindow()
    }
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  mainWindow = null
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Clean up IPC handlers when app is quitting
app.on('before-quit', () => {
  ipcMain.removeHandler('window-is-maximized')
  ipcMain.removeAllListeners('window-minimize')
  ipcMain.removeAllListeners('window-maximize')
  ipcMain.removeAllListeners('window-close')
})
