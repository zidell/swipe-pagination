import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const out = (path) => new URL(`../dist/${path}`, import.meta.url);

mkdirSync(out('themes'), { recursive: true });
mkdirSync(out('svelte'), { recursive: true });

const base = read('src/styles/base.css');
writeFileSync(out('base.css'), base);

// Every theme ships standalone (structure + theme), so users import exactly one file.
for (const file of readdirSync(new URL('../src/styles/themes', import.meta.url))) {
  const css = `${base}\n${read(`src/styles/themes/${file}`)}`;
  writeFileSync(out(`themes/${file}`), css);
  if (file === 'default.css') writeFileSync(out('style.css'), css);
}

for (const file of ['SwipePagination.svelte', 'index.js', 'index.d.ts']) {
  copyFileSync(new URL(`../src/svelte/${file}`, import.meta.url), out(`svelte/${file}`));
}
