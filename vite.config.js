import { defineConfig } from 'vite';

export default defineConfig({
  base: '/crunch-pdf/',
  resolve: {
    alias: {
      'pdf-lib': 'pdf-lib/es/index.js',
    },
    mainFields: ['module', 'jsnext:main', 'jsnext'],
  },
  server: {
    open: '/crunch-pdf/',
  },
});
