# apple-container-app

## Electron wrapper

This repository contains a React UI in `ui/` and a lightweight Electron wrapper in `electron/`.

### Development

1. Install root and UI deps:

```bash
npm install
npm --prefix ui install
```

2. Start Vite and Electron together:

```bash
npm run dev
```

### Using IPC from the renderer (prototype)

In your React code, call the bridged API exposed by `preload`:

```ts
// Exec (aggregated output)
const { code, stdout, stderr } = await window.api.exec('echo', ['hello'])

// Spawn (streaming)
const { runId } = await window.api.spawn('bash', ['-lc', 'for i in {1..3}; do echo $i; sleep 1; done'])
const offOut = window.api.onSpawnStdout(({ runId: id, chunk }) => { if (id === runId) console.log('out', chunk) })
const offErr = window.api.onSpawnStderr(({ runId: id, chunk }) => { if (id === runId) console.error('err', chunk) })
const offClose = window.api.onSpawnClose(({ runId: id, code }) => { if (id === runId) console.log('closed', code) })
```

### Packaging

```bash
npm run build
```

This builds the UI with Vite and packages a macOS app via `electron-builder`.
