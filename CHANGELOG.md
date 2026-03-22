# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

## [Unreleased]

### Added
- Five compression levels (previously three) for finer control over quality vs. file size
- Level 3 now uses lossless PNG encoding — no JPEG artifacts, ideal for scanned text documents
- DPI downscaling option (scale factor) per compression level
- Web Worker for PDF assembly via pdf-lib, keeping the UI responsive during compression
- Unit tests with Vitest (`lib.test.js`)
- E2E tests with Playwright (`e2e/`)

### Changed
- Rasterization moved from the Web Worker back to the main thread to avoid pdfjs DOM dependency (`document.createElement`) errors in worker context
- pdf-lib runs exclusively in the Web Worker (no DOM required); pdfjs runs in the main thread
- JPEG quality for rasterization levels raised significantly for better readability:
  - Level 4: 85% JPEG at full resolution
  - Level 5: 70% JPEG at full resolution
- `getCompressionSettings` extracted from `app.js` into `lib.js` for testability
- pdfjs worker now loaded via Vite `?url` import from `node_modules` instead of a manually copied file in `public/`

### Fixed
- `document.createElement` error when using pdfjs inside a Web Worker
- Vite error "file is in /public and should not be imported from source code" for pdfjs worker
- Incorrect CLAUDE.md reference to `getCompressionSettings` location (was `app.js`, now `lib.js`)
