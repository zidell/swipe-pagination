import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  root: fileURLToPath(new URL('.', import.meta.url)),
  // Deployed under https://zidell.github.io/swipe-pagination/; local dev stays at the root.
  base: command === 'build' ? '/swipe-pagination/' : '/',
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
}));
