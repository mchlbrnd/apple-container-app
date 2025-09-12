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

### Packaging

```bash
npm run build
```

This builds the UI with Vite and packages a macOS app via `electron-builder`.
