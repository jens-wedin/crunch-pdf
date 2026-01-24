import { defineConfig } from 'vite';

export default defineConfig({
  base: '/crunch-pdf/',
  optimizeDeps: {
    include: ['pdf-lib', 'pdfjs-dist'],
  },
});
