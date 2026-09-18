import { defineConfig, type Options } from 'tsup';

const shared: Options = {
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  target: 'es2020',
  // Wrappers import the core by package name so every entry shares one class.
  external: ['swipe-pagination', 'react', 'vue', 'svelte'],
};

export default defineConfig([
  { ...shared, entry: { index: 'src/index.ts' } },
  { ...shared, entry: { react: 'src/react/index.tsx' }, banner: { js: '"use client";' } },
  { ...shared, entry: { vue: 'src/vue/index.ts' } },
  {
    entry: { 'swipe-pagination': 'src/index.ts' },
    format: ['iife'],
    globalName: 'SwipePagination',
    minify: true,
    target: 'es2020',
    outExtension: () => ({ js: '.iife.js' }),
    footer: { js: 'SwipePagination=SwipePagination.default;' },
  },
]);
