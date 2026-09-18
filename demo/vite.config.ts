import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  // Served from the root of swipe-pagination.gitools.net
  base: '/',
  plugins: [tailwindcss()],
  server: { port: 4790, strictPort: true },
  preview: { port: 4790, strictPort: true },
  resolve: {
    alias: [{ find: /^swipe-pagination$/, replacement: fileURLToPath(new URL('../src/index.ts', import.meta.url)) }],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
