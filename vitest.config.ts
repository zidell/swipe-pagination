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
    // forks 워커는 별도 프로세스라 테스트가 무한 루프에 빠진 채 vitest가 죽으면 고아로 남아 CPU를 계속 쓴다.
    // threads는 같은 프로세스 안이라 함께 종료된다.
    pool: 'threads',
    setupFiles: ['test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx,svelte}'],
      exclude: ['src/**/*.d.ts'],
      thresholds: { 100: true },
    },
  },
});
