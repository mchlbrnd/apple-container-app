const { contextBridge, ipcRenderer } = require('electron')

// Expose a minimal API surface for future native integrations
contextBridge.exposeInMainWorld('api', {
  platform: process.platform,
  versions: process.versions,
  exec: (command, args = [], options = {}) => ipcRenderer.invoke('cmd:exec', { command, args, options }),
  spawn: (command, args = [], options = {}) => ipcRenderer.invoke('cmd:spawn', { command, args, options }),
  onSpawnStdout: (handler) => {
    const listener = (_e, data) => handler(data)
    ipcRenderer.on('cmd:spawn:stdout', listener)
    return () => ipcRenderer.removeListener('cmd:spawn:stdout', listener)
  },
  onSpawnStderr: (handler) => {
    const listener = (_e, data) => handler(data)
    ipcRenderer.on('cmd:spawn:stderr', listener)
    return () => ipcRenderer.removeListener('cmd:spawn:stderr', listener)
  },
  onSpawnClose: (handler) => {
    const listener = (_e, data) => handler(data)
    ipcRenderer.on('cmd:spawn:close', listener)
    return () => ipcRenderer.removeListener('cmd:spawn:close', listener)
  },
  kill: (runId, signal = 'SIGTERM') => ipcRenderer.invoke('cmd:kill', { runId, signal }),
})


