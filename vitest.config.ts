import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: [{ find: /^swipe-pagination$/, replacement: fileURLToPath(new URL('./src/index.ts', import.meta.url)) }],
    conditions: ['browser'],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx,svelte}'],
      exclude: ['src/**/*.d.ts'],
      thresholds: { 100: true },
    },
  },
});
