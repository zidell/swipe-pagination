import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const out = (path) => new URL(`../dist/${path}`, import.meta.url);

mkdirSync(out('themes'), { recursive: true });

const base = read('src/styles/base.css');
writeFileSync(out('base.css'), base);

// Every theme ships standalone (structure + theme), so users import exactly one file.
for (const file of readdirSync(new URL('../src/styles/themes', import.meta.url))) {
  const css = `${base}\n${read(`src/styles/themes/${file}`)}`;
  writeFileSync(out(`themes/${file}`), css);
  if (file === 'default.css') writeFileSync(out('style.css'), css);
}

// Svelte components ship as source and are compiled by the consumer. Svelte 5
// gets the runes component; Svelte 3 and 4 share the legacy one, so svelte3 is
// declarations only and its entry points at dist/svelte4/index.js.
for (const dir of ['svelte', 'svelte4']) {
  mkdirSync(out(dir), { recursive: true });
  for (const file of ['SwipePagination.svelte', 'index.js', 'index.d.ts']) {
    copyFileSync(new URL(`../src/${dir}/${file}`, import.meta.url), out(`${dir}/${file}`));
  }
}
mkdirSync(out('svelte3'), { recursive: true });
copyFileSync(new URL('../src/svelte3/index.d.ts', import.meta.url), out('svelte3/index.d.ts'));
