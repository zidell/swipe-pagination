import '../src/styles/base.css';
import './demo.css';
import { SwipePagination, type SwipePaginationOptions } from 'swipe-pagination';
import pkg from '../package.json';
import bootstrap5Css from '../src/styles/themes/bootstrap5.css?raw';
import bulmaCss from '../src/styles/themes/bulma.css?raw';
import daisyuiCss from '../src/styles/themes/daisyui.css?raw';
import defaultCss from '../src/styles/themes/default.css?raw';
import mantineCss from '../src/styles/themes/mantine.css?raw';
import picoCss from '../src/styles/themes/pico.css?raw';
import shadcnCss from '../src/styles/themes/shadcn.css?raw';

const $ = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const fmt = (n: number) => n.toLocaleString('en-US');
const domCount = (sp: SwipePagination) => sp.root.querySelectorAll('.swipe-pagination__item').length;

$('#version').textContent = `v${pkg.version}`;

// ---------------------------------------------------------------- themes (scoped with CSS nesting so all can coexist)

interface Theme {
  id: string;
  name: string;
  css?: string;
  importLine: string;
  note: string;
  options?: SwipePaginationOptions;
}

const TAILWIND_CLASSES: SwipePaginationOptions['classNames'] = {
  root: '[--sp-gap:6px] gap-1.5',
  arrow: 'size-9 rounded-full border-0 bg-transparent text-slate-500 cursor-pointer hover:bg-slate-100 disabled:opacity-30 disabled:cursor-default',
  item: 'h-9 min-w-9 px-3 rounded-full border-0 text-sm font-semibold cursor-pointer transition-colors',
  inactive: 'bg-transparent text-slate-600 hover:bg-slate-100',
  active: 'bg-violet-600 text-white shadow-sm shadow-violet-300',
};

const THEMES: Theme[] = [
  { id: 'default', name: 'Default', css: defaultCss, importLine: "import 'swipe-pagination/style.css';", note: 'Follows currentColor. Works in light and dark.' },
  { id: 'bootstrap5', name: 'Bootstrap 5', css: bootstrap5Css, importLine: "import 'swipe-pagination/themes/bootstrap5.css';", note: 'Reads --bs-* variables, including data-bs-theme="dark".' },
  { id: 'daisyui', name: 'daisyUI 5', css: daisyuiCss, importLine: "import 'swipe-pagination/themes/daisyui.css';", note: 'Reads --color-* and --radius-field, so every daisyUI theme applies.' },
  { id: 'shadcn', name: 'shadcn/ui', css: shadcnCss, importLine: "import 'swipe-pagination/themes/shadcn.css';", note: 'Reads --primary, --accent, --ring and --radius.' },
  { id: 'bulma', name: 'Bulma 1', css: bulmaCss, importLine: "import 'swipe-pagination/themes/bulma.css';", note: 'Reads --bulma-* variables.' },
  { id: 'pico', name: 'Pico CSS 2', css: picoCss, importLine: "import 'swipe-pagination/themes/pico.css';", note: 'Reads --pico-* variables and wins over Pico’s global button styles.' },
  { id: 'mantine', name: 'Mantine 7+', css: mantineCss, importLine: "import 'swipe-pagination/themes/mantine.css';", note: 'Reads --mantine-* variables, including the dark color scheme.' },
  {
    id: 'tailwind',
    name: 'Tailwind CSS',
    importLine: "import 'swipe-pagination/base.css';",
    note: 'Structure only. Styling comes from your utility classes via classNames.',
    options: { classNames: TAILWIND_CLASSES },
  },
];

const scoped = document.createElement('style');
scoped.textContent = THEMES.filter((t) => t.css)
  .map((t) => `.theme-${t.id} {\n${t.css}\n}`)
  .join('\n');
document.head.append(scoped);

const grid = $('#theme-grid');
for (const theme of THEMES) {
  const card = document.createElement('article');
  card.className = 'theme-card';
  card.innerHTML = `
    <header><h3></h3><p></p></header>
    <div class="theme-card__stage theme-${theme.id}"></div>
    <code class="theme-card__import"></code>`;
  card.querySelector('h3')!.textContent = theme.name;
  card.querySelector('p')!.textContent = theme.note;
  card.querySelector('code')!.textContent = theme.importLine;
  grid.append(card);
  new SwipePagination(card.querySelector('.theme-card__stage')!, { total: 250, active: 42, ...theme.options });
}

// ---------------------------------------------------------------- hero

const hero = new SwipePagination($('#hero'), {
  total: 5000,
  active: 1234,
  onChange: () => updateHero(),
});

function updateHero() {
  $('#hero-page').textContent = fmt(hero.getActive());
  $('#hero-dom').textContent = String(domCount(hero));
  const range = hero.getVisibleRange();
  $('#hero-range').textContent = range ? `${fmt(range.start)}–${fmt(range.end)}` : '–';
}
hero.root.addEventListener('scroll', () => requestAnimationFrame(updateHero), { capture: true, passive: true });
updateHero();

// ---------------------------------------------------------------- playground

const form = $<HTMLFormElement>('#pg-controls');
const field = <T extends HTMLInputElement>(name: string) => form.elements.namedItem(name) as T;
const log = $('#log');

const pg = new SwipePagination($('#pg'), {
  total: 5000,
  active: 1234,
  onChange(page, event) {
    event?.preventDefault();
    field('active').value = String(page);
    const entry = document.createElement('li');
    entry.textContent = `onChange(${fmt(page)}${event ? `, ${event.type}` : ''})`;
    log.prepend(entry);
    while (log.children.length > 6) log.lastElementChild!.remove();
    updateReadout();
  },
});

function updateReadout() {
  $('#ro-active').textContent = fmt(pg.getActive());
  $('#ro-total').textContent = fmt(pg.getTotal());
  const range = pg.getVisibleRange();
  $('#ro-range').textContent = range ? `{ start: ${fmt(range.start)}, end: ${fmt(range.end)} }` : 'null';
  $('#ro-dom').textContent = String(domCount(pg));
}
pg.root.addEventListener('scroll', () => requestAnimationFrame(updateReadout), { capture: true, passive: true });
new ResizeObserver(() => requestAnimationFrame(updateReadout)).observe($('#pg-resizable'));
updateReadout();

form.addEventListener('input', (event) => {
  const input = event.target as HTMLInputElement;
  const value = Number(input.value);
  switch (input.name) {
    case 'total':
      if (value >= 1) pg.update({ total: value });
      field('active').value = String(pg.getActive());
      break;
    case 'active':
      if (value >= 1) pg.setActive(value);
      break;
    case 'href':
      pg.update({ href: input.checked ? (page) => `#page-${page}` : undefined });
      break;
    default:
      pg.update({ [input.name]: value });
      (form.elements.namedItem(`${input.name}Out`) as HTMLOutputElement).value = input.value;
  }
  requestAnimationFrame(updateReadout);
});

form.querySelector('.presets')!.addEventListener('click', (event) => {
  const total = (event.target as HTMLElement).closest<HTMLElement>('[data-total]')?.dataset.total;
  if (!total) return;
  field('total').value = total;
  pg.update({ total: Number(total) });
  field('active').value = String(pg.getActive());
  requestAnimationFrame(updateReadout);
});

document.querySelector('.methods')!.addEventListener('click', (event) => {
  const method = (event.target as HTMLElement).closest<HTMLElement>('[data-method]')?.dataset.method;
  switch (method) {
    case 'scrollPrev':
      return pg.scrollPrev();
    case 'scrollNext':
      return pg.scrollNext();
    case 'scrollToActive':
      return pg.scrollToActive();
    case 'goFirst':
      return pg.goTo(1);
    case 'goLast':
      return pg.goTo(pg.getTotal());
    case 'random': {
      const page = 1 + Math.floor(Math.random() * pg.getTotal());
      pg.setActive(page);
      field('active').value = String(page);
      return requestAnimationFrame(updateReadout);
    }
    case 'refresh':
      return pg.refresh();
  }
});

// ---------------------------------------------------------------- usage tabs

const USAGE: Record<string, string> = {
  'Vanilla JS': `import { SwipePagination } from 'swipe-pagination';
import 'swipe-pagination/style.css';

const pager = new SwipePagination(document.querySelector('#pager'), {
  total: 5000,
  active: 1,
  onChange(page) {
    loadPage(page);
  },
});

// later
pager.update({ total: 6000 });
pager.setActive(42);   // silent
pager.goTo(43);        // fires onChange
pager.destroy();`,
  React: `import { useRef, useState } from 'react';
import { SwipePagination, type SwipePaginationInstance } from 'swipe-pagination/react';
import 'swipe-pagination/style.css';

export function Posts({ total }: { total: number }) {
  const [page, setPage] = useState(1);
  const pager = useRef<SwipePaginationInstance>(null);

  return (
    <>
      <SwipePagination ref={pager} total={total} active={page} onChange={setPage} />
      <button onClick={() => pager.current?.scrollToActive()}>Back to current</button>
    </>
  );
}`,
  Vue: `<script setup lang="ts">
import { ref } from 'vue';
import { SwipePagination } from 'swipe-pagination/vue';
import 'swipe-pagination/style.css';

const page = ref(1);
const pager = ref(); // pager.value.getInstance()
</script>

<template>
  <SwipePagination ref="pager" :total="5000" v-model:active="page" @change="loadPage" />
</template>`,
  Svelte: `<script>
  import { SwipePagination } from 'swipe-pagination/svelte';
  import 'swipe-pagination/style.css';

  let page = 1;
  let pager; // pager.getInstance()
</script>

<SwipePagination bind:this={pager} total={5000} bind:active={page} onChange={loadPage} />`,
  'Links (SSR / MPA)': `// Each page becomes a real <a href>, so crawlers and middle-click work.
new SwipePagination(el, {
  total: 120,
  active: currentPage,
  href: (page) => \`/posts?page=\${page}\`,
});

// SPA router: keep the links, but navigate client-side
new SwipePagination(el, {
  total: 120,
  href: (page) => \`/posts?page=\${page}\`,
  onChange(page, event) {
    event?.preventDefault();
    router.push(\`/posts?page=\${page}\`);
  },
});`,
  'CDN': `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swipe-pagination/dist/style.css">
<script src="https://cdn.jsdelivr.net/npm/swipe-pagination/dist/swipe-pagination.iife.js"></script>

<div id="pager"></div>
<script>
  new SwipePagination(document.getElementById('pager'), { total: 300 });
</script>`,
  Tailwind: `import { SwipePagination } from 'swipe-pagination';
import 'swipe-pagination/base.css'; // structure only

new SwipePagination(el, {
  total: 250,
  classNames: {
    root: '[--sp-gap:6px] gap-1.5',
    arrow: 'size-9 rounded-full text-slate-500 hover:bg-slate-100 disabled:opacity-30',
    item: 'h-9 min-w-9 px-3 rounded-full text-sm font-semibold',
    inactive: 'text-slate-600 hover:bg-slate-100',
    active: 'bg-violet-600 text-white',
  },
});`,
};

const tabs = $('#usage-tabs');
const tabList = document.createElement('div');
tabList.className = 'tabs__list';
tabList.setAttribute('role', 'tablist');
const panel = document.createElement('div');
panel.className = 'code';
panel.innerHTML = '<button type="button" class="copy">Copy</button><pre><code></code></pre>';
tabs.append(tabList, panel);

function showTab(name: string) {
  for (const tab of tabList.children) tab.setAttribute('aria-selected', String((tab as HTMLElement).dataset.tab === name));
  panel.querySelector('code')!.textContent = USAGE[name];
  panel.querySelector<HTMLElement>('.copy')!.dataset.copy = USAGE[name];
}
for (const name of Object.keys(USAGE)) {
  const tab = document.createElement('button');
  tab.type = 'button';
  tab.setAttribute('role', 'tab');
  tab.dataset.tab = name;
  tab.textContent = name;
  tab.addEventListener('click', () => showTab(name));
  tabList.append(tab);
}
showTab('Vanilla JS');

// ---------------------------------------------------------------- API tables

function table(id: string, head: string[], rows: string[][]) {
  const el = $(`#${id}`);
  const thead = `<thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead>`;
  const tbody = rows.map((row) => `<tr>${row.map((cell, i) => (i === 0 ? `<td><code>${cell}</code></td>` : `<td>${cell}</td>`)).join('')}</tr>`);
  el.innerHTML = `${thead}<tbody>${tbody.join('')}</tbody>`;
}

table('options-table', ['Option', 'Type', 'Default', 'Description'], [
  ['total', 'number', '1', 'Number of pages.'],
  ['active', 'number', '1', 'Current page, 1-based. Clamped to 1…total.'],
  ['onChange', '(page, event?) =&gt; void', '–', 'Runs when the user picks a page (click, tap, Enter) or <code>goTo()</code> changes it. <code>event</code> is the DOM event, if there is one.'],
  ['href', '(page) =&gt; string', '–', 'Render pages as <code>&lt;a href&gt;</code>. Plain clicks still call <code>onChange</code>. Modified clicks (new tab) are left to the browser.'],
  ['sideMargin', 'number', '8', 'Space before the first and after the last page, in px.'],
  ['scrollStep', 'number', '0.9', 'Arrow scroll distance as a fraction of the visible width.'],
  ['duration', 'number', '300', 'Scroll animation length in ms. <code>0</code> turns animation off.'],
  ['overscan', 'number', '120', 'Extra px rendered past each edge.'],
  ['classNames', 'Partial&lt;ClassNames&gt;', '–', 'Classes appended to the built-in ones. See below.'],
  ['labels', '{ root, prev, next, page(n) }', 'English', 'Accessible labels, for i18n.'],
  ['prevIcon / nextIcon', 'string (HTML)', 'SVG chevron', 'Trusted markup for the arrow buttons.'],
]);

table('methods-table', ['Method', 'Description'], [
  ['setActive(page, { scroll?, animate? })', 'Change the current page <em>without</em> calling <code>onChange</code>. Centers it unless <code>scroll: false</code>.'],
  ['goTo(page)', 'Change the current page like a user would: centers it and calls <code>onChange</code> if the page changed.'],
  ['scrollPrev() / scrollNext()', 'Same as the arrows. Calls during an animation add up, so repeated presses keep going.'],
  ['scrollToPage(page, { animate? })', 'Center any page without selecting it.'],
  ['scrollToActive({ animate? })', 'Center the current page.'],
  ['update(options)', 'Change options. Only the keys you pass change. <code>active</code> is applied only when the value you pass changes.'],
  ['refresh()', 'Measure the items again after a font or theme change. Web fonts are handled automatically.'],
  ['getActive() / getTotal()', 'Current state.'],
  ['getVisibleRange()', '<code>{ start, end }</code> of the pages in view, or <code>null</code> while the strip is hidden.'],
  ['destroy()', 'Remove the DOM and stop observing.'],
  ['root', 'The <code>&lt;nav&gt;</code> element (read-only property).'],
]);

table('vars-table', ['Variable', 'Default', 'Description'], [
  ['--sp-gap', 'theme', 'Space between items. The core reads it when measuring, so it can be negative (collapsed borders).'],
  ['--sp-fade', '24px', 'Width of the edge fade. It uses a mask, so it works on any background, and only appears on a side that has more pages. <code>0</code> turns it off.'],
  ['--sp-size', '2.25rem', 'Item height and minimum width (default theme).'],
  ['--sp-padding-x', '0.625rem', 'Horizontal item padding (default theme).'],
  ['--sp-radius', '0.5rem', 'Item corner radius (default theme).'],
  ['--sp-font-size', '0.9375rem', 'Font size (default theme).'],
  ['--sp-hover-bg', 'currentColor 9%', 'Hover background (default theme).'],
  ['--sp-active-bg / --sp-active-color', '#2563eb / #fff', 'Current page colors (default theme).'],
  ['--sp-focus-ring', '#2563eb', 'Keyboard focus outline (default theme).'],
]);

table('classes-table', ['Key', 'Built-in class', 'Element'], [
  ['root', 'swipe-pagination', '&lt;nav&gt; wrapper'],
  ['arrow', 'swipe-pagination__arrow', 'Both arrow buttons'],
  ['prev / next', 'swipe-pagination__arrow--prev / --next', 'One arrow button'],
  ['viewport', 'swipe-pagination__viewport', 'Scrolling area'],
  ['track', 'swipe-pagination__track', 'Full-width inner track'],
  ['item', 'swipe-pagination__item', 'Every page'],
  ['active', 'swipe-pagination__item--active', 'Current page (also has <code>aria-current="page"</code>)'],
  ['inactive', '–', 'Every page except the current one. Handy for utility classes.'],
]);

// ---------------------------------------------------------------- copy buttons & dark mode

document.addEventListener('click', async (event) => {
  const button = (event.target as HTMLElement).closest<HTMLElement>('.copy');
  if (!button?.dataset.copy) return;
  try {
    await navigator.clipboard.writeText(button.dataset.copy);
    button.textContent = 'Copied';
  } catch {
    button.textContent = 'Press ⌘C';
  }
  setTimeout(() => (button.textContent = 'Copy'), 1500);
});

$('#theme-toggle').addEventListener('click', () => {
  const root = document.documentElement;
  const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = dark ? 'light' : 'dark';
  try {
    localStorage.setItem('sp-demo-theme', root.dataset.theme);
  } catch {}
});
