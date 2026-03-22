# Crunch PDF

A client-side PDF compression tool. Drop a PDF, pick a compression level, download the result. No uploads — everything runs in your browser.

## Features

- 5 compression levels from lossless optimization to aggressive rasterization
- Lossless quality options that preserve selectable text (levels 1–2)
- Rasterization with PNG or JPEG encoding for maximum size reduction (levels 3–5)
- Strips metadata on levels 2–5
- No server — all processing happens locally in the browser

## Compression levels

| Level | Method | Quality | Notes |
|-------|--------|---------|-------|
| 1 | Object streams | — | Lossless. Preserves text and metadata. |
| 2 | Object streams | — | Lossless. Strips metadata. |
| 3 | Rasterize → PNG | Lossless | No compression artifacts. Best for scanned text. |
| 4 | Rasterize → JPEG | 85% | Good quality, smaller files. |
| 5 | Rasterize → JPEG | 70% | Smaller files, slight quality loss. |

Levels 3–5 convert text to raster images — the PDF will no longer have selectable/searchable text.

## Development

```bash
npm install
npm run dev        # Start dev server at http://localhost:5173/crunch-pdf/
npm run build      # Production build to dist/
npm run preview    # Preview production build
npm run test       # Unit tests (Vitest)
npm run test:e2e   # E2E tests (Playwright)
```

## Architecture

- `index.html` — Single page UI
- `app.js` — Main thread: drag-and-drop, file handling, pdfjs rasterization
- `compress-worker.js` — Web Worker: PDF assembly via pdf-lib (no DOM)
- `lib.js` — Compression settings and utilities
- `styles.css` — Dark theme, CSS custom properties

**Key libraries:** [pdf-lib](https://pdf-lib.js.org/) for PDF manipulation, [pdfjs-dist](https://mozilla.github.io/pdf.js/) for page rendering, [Vite](https://vitejs.dev/) for bundling.

## Deployment

Deployed to GitHub Pages at `/crunch-pdf/`. The Vite `base` is set to `/crunch-pdf/` — adjust `vite.config.js` if deploying elsewhere.
