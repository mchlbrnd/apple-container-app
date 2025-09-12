const { app, BrowserWindow, shell, ipcMain } = require('electron')
const path = require('path')
const { exec, spawn } = require('child_process')

const isDev = process.env.NODE_ENV !== 'production'
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      devTools: isDev,
    },
    titleBarStyle: 'default'
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  if (isDev) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
  } else {
    const indexHtml = path.join(__dirname, '..', 'ui', 'dist', 'index.html')
    mainWindow.loadFile(indexHtml)
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })
}

app.whenReady().then(() => {
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC: execute a command and return aggregated output
ipcMain.handle('cmd:exec', async (_event, payload) => {
  const { command, args = [], options = {} } = payload || {}
  return new Promise((resolve, reject) => {
    const full = [command, ...args].join(' ')
    exec(full, { ...options, windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        return reject({ code: error.code ?? 1, error: String(error), stdout: String(stdout || ''), stderr: String(stderr || '') })
      }
      resolve({ code: 0, stdout: String(stdout || ''), stderr: String(stderr || '') })
    })
  })
})

// IPC: spawn a command with streaming output; returns a run id
const activeProcesses = new Map()

ipcMain.handle('cmd:spawn', async (event, payload) => {
  const { command, args = [], options = {} } = payload || {}
  const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const child = spawn(command, args, { ...options, windowsHide: true, shell: false })
  activeProcesses.set(runId, child)

  const wc = event.sender
  child.stdout.on('data', (d) => wc.send('cmd:spawn:stdout', { runId, chunk: d.toString() }))
  child.stderr.on('data', (d) => wc.send('cmd:spawn:stderr', { runId, chunk: d.toString() }))
  child.on('error', (err) => wc.send('cmd:spawn:error', { runId, error: String(err) }))
  child.on('close', (code, signal) => {
    wc.send('cmd:spawn:close', { runId, code: code ?? 0, signal: signal || null })
    activeProcesses.delete(runId)
  })

  return { runId }
})

ipcMain.handle('cmd:kill', async (_event, { runId, signal = 'SIGTERM' }) => {
  const child = activeProcesses.get(runId)
  if (!child) return { ok: false }
  try {
    child.kill(signal)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
})


