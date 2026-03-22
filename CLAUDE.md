# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Crunch PDF is a client-side PDF compression tool. All processing happens in the browser — no server-side component. Users drag-and-drop a PDF, choose a compression level, and download the compressed result.

## Commands

- `npm run dev` — Start Vite dev server (opens at `/crunch-pdf/`)
- `npm run build` — Production build to `dist/`
- `npm run preview` — Preview production build
- `npm run test` — Run unit tests (Vitest)
- `npm run test:e2e` — Run E2E tests (Playwright)

## Architecture

Main source files at the root: `index.html`, `app.js`, `styles.css`, `lib.js`, `compress-worker.js`.

**Key libraries:**
- `pdf-lib` — PDF manipulation (copying pages, stripping metadata, embedding images, saving with object streams)
- `pdfjs-dist` — PDF rendering (used in the main thread to rasterize pages to canvas for high-compression levels)

**Compression levels (defined in `getCompressionSettings` in `lib.js`):**
- **Level 1** — Copies pages into a new PDF with object streams. Keeps metadata.
- **Level 2** — Same as level 1 but strips all metadata (title, author, subject, keywords, producer, creator).
- **Level 3** — Rasterizes pages at 70% JPEG quality, scale 1.0. Text becomes raster.
- **Level 4** — Rasterizes at 50% quality, scale 0.75 (DPI downscale).
- **Level 5** — Rasterizes at 30% quality, scale 0.5. Maximum compression.

**Rasterization architecture:**
- Levels 3–5 use `compressPDFViaRasterize` in `app.js` (main thread).
- pdfjs renders pages to `OffscreenCanvas` → JPEG bytes in the main thread (pdfjs requires DOM APIs).
- JPEG bytes are transferred (zero-copy) to `compress-worker.js`.
- The worker uses only `pdf-lib` (no DOM) to rebuild the PDF from the JPEG data.

**Important configuration:**
- Vite `base` is set to `/crunch-pdf/` (for GitHub Pages deployment).
- The pdf.js worker is loaded via `pdfjs-dist/build/pdf.worker.min.mjs?url` (Vite `?url` import) — do not reference `public/pdf.worker.min.mjs` from source code.
- `pdf-lib` is aliased to `pdf-lib/es/index.js` in Vite config to resolve the ES module entry.

## Styles

Dark theme using CSS custom properties defined in `:root` in `styles.css`. Uses Inter font from Google Fonts. Responsive breakpoint at 768px.
