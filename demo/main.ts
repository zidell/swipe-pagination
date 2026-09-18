import { SwipePagination, type SwipePaginationOptions } from 'swipe-pagination';
import pkg from '../package.json';
import bootstrap5Css from '../src/styles/themes/bootstrap5.css?raw';
import bulmaCss from '../src/styles/themes/bulma.css?raw';
import daisyuiCss from '../src/styles/themes/daisyui.css?raw';
import defaultCss from '../src/styles/themes/default.css?raw';
import mantineCss from '../src/styles/themes/mantine.css?raw';
import picoCss from '../src/styles/themes/pico.css?raw';
import shadcnCss from '../src/styles/themes/shadcn.css?raw';

import { applyStaticText, lang, tx } from './i18n';

const $ = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const fmt = (n: number) => n.toLocaleString('en-US');
const domCount = (sp: SwipePagination) => sp.root.querySelectorAll('.swipe-pagination__item').length;

// Must run first: it replaces markup that the code below looks up by id.
applyStaticText();
$('#version').textContent = `v${pkg.version}`;

const labels: SwipePaginationOptions['labels'] =
  lang === 'ko' ? { root: '페이지 이동', prev: '이전 페이지들', next: '다음 페이지들', page: (page) => `${page}페이지` } : undefined;

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
  {
    id: 'default',
    name: tx('Default', '기본'),
    css: defaultCss,
    importLine: "import 'swipe-pagination/style.css';",
    note: tx('Follows currentColor. Works in light and dark.', 'currentColor를 따라가서 라이트·다크 모두에 어울립니다.'),
  },
  {
    id: 'bootstrap5',
    name: 'Bootstrap 5',
    css: bootstrap5Css,
    importLine: "import 'swipe-pagination/themes/bootstrap5.css';",
    note: tx('Reads --bs-* variables, including data-bs-theme="dark".', '--bs-* 변수를 읽고, data-bs-theme="dark"도 따라갑니다.'),
  },
  {
    id: 'daisyui',
    name: 'daisyUI 5',
    css: daisyuiCss,
    importLine: "import 'swipe-pagination/themes/daisyui.css';",
    note: tx('Reads --color-* and --radius-field, so every daisyUI theme applies.', '--color-*와 --radius-field를 읽어서 모든 daisyUI 테마가 적용됩니다.'),
  },
  {
    id: 'shadcn',
    name: 'shadcn/ui',
    css: shadcnCss,
    importLine: "import 'swipe-pagination/themes/shadcn.css';",
    note: tx('Reads --primary, --accent, --ring and --radius.', '--primary, --accent, --ring, --radius를 읽습니다.'),
  },
  {
    id: 'bulma',
    name: 'Bulma 1',
    css: bulmaCss,
    importLine: "import 'swipe-pagination/themes/bulma.css';",
    note: tx('Reads --bulma-* variables.', '--bulma-* 변수를 읽습니다.'),
  },
  {
    id: 'pico',
    name: 'Pico CSS 2',
    css: picoCss,
    importLine: "import 'swipe-pagination/themes/pico.css';",
    note: tx('Reads --pico-* variables and wins over Pico’s global button styles.', '--pico-* 변수를 읽고, Pico의 전역 버튼 스타일보다 우선합니다.'),
  },
  {
    id: 'mantine',
    name: 'Mantine 7+',
    css: mantineCss,
    importLine: "import 'swipe-pagination/themes/mantine.css';",
    note: tx('Reads --mantine-* variables, including the dark color scheme.', '--mantine-* 변수를 읽고, 다크 컬러 스킴도 따라갑니다.'),
  },
  {
    id: 'tailwind',
    name: 'Tailwind CSS',
    importLine: "import 'swipe-pagination/base.css';",
    note: tx('Structure only. Styling comes from your utility classes via classNames.', '구조만 담당합니다. 스타일은 classNames로 넘긴 유틸리티 클래스가 정합니다.'),
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
  new SwipePagination(card.querySelector('.theme-card__stage')!, { total: 250, active: 42, labels, ...theme.options });
}

// ---------------------------------------------------------------- hero

const hero = new SwipePagination($('#hero'), {
  total: 5000,
  active: 1234,
  labels,
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
  labels,
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

${tx('// later', '// 이후에')}
pager.update({ total: 6000 });
pager.setActive(42);   ${tx('// silent', '// onChange 호출 안 함')}
pager.goTo(43);        ${tx('// fires onChange', '// onChange 호출')}
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
const pager = ref(); ${tx('// pager.value.getInstance()', '// pager.value.getInstance()로 인스턴스 접근')}
</script>

<template>
  <SwipePagination ref="pager" :total="5000" v-model:active="page" @change="loadPage" />
</template>`,
  Svelte: `<script>
  import { SwipePagination } from 'swipe-pagination/svelte';
  import 'swipe-pagination/style.css';

  let page = 1;
  let pager; ${tx('// pager.getInstance()', '// pager.getInstance()로 인스턴스 접근')}
</script>

<SwipePagination bind:this={pager} total={5000} bind:active={page} onChange={loadPage} />`,
  'Links (SSR / MPA)': `${tx('// Each page becomes a real <a href>, so crawlers and middle-click work.', '// 각 페이지가 실제 <a href>가 되어 검색엔진과 가운데 클릭이 동작합니다.')}
new SwipePagination(el, {
  total: 120,
  active: currentPage,
  href: (page) => \`/posts?page=\${page}\`,
});

${tx('// SPA router: keep the links, but navigate client-side', '// SPA 라우터: 링크는 유지하고 이동은 클라이언트에서')}
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
import 'swipe-pagination/base.css'; ${tx('// structure only', '// 구조만')}

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
panel.innerHTML = `<button type="button" class="copy">${tx('Copy', '복사')}</button><pre><code></code></pre>`;
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
  tab.textContent = name === 'Links (SSR / MPA)' ? tx(name, '링크 (SSR / MPA)') : name;
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

table('options-table', [tx('Option', '옵션'), tx('Type', '타입'), tx('Default', '기본값'), tx('Description', '설명')], [
  ['total', 'number', '1', tx('Number of pages.', '페이지 수.')],
  ['active', 'number', '1', tx('Current page, 1-based. Clamped to 1…total.', '현재 페이지(1부터 시작). 1…total 범위로 맞춰집니다.')],
  ['onChange', '(page, event?) =&gt; void', '–', tx(
    'Runs when the user picks a page (click, tap, Enter) or <code>goTo()</code> changes it. <code>event</code> is the DOM event, if there is one.',
    '사용자가 페이지를 고르거나(클릭, 탭, Enter) <code>goTo()</code>로 바뀌면 호출됩니다. <code>event</code>는 원인이 된 DOM 이벤트입니다(있을 때만).',
  )],
  ['href', '(page) =&gt; string', '–', tx(
    'Render pages as <code>&lt;a href&gt;</code>. Plain clicks still call <code>onChange</code>. Modified clicks (new tab) are left to the browser.',
    '페이지를 <code>&lt;a href&gt;</code> 링크로 렌더링합니다. 일반 클릭은 그대로 <code>onChange</code>를 호출하고, 새 탭 열기 같은 보조키 클릭은 브라우저에 맡깁니다.',
  )],
  ['sideMargin', 'number', '8', tx('Space before the first and after the last page, in px.', '첫 페이지 앞과 마지막 페이지 뒤의 여백(px).')],
  ['scrollStep', 'number', '0.9', tx('Arrow scroll distance as a fraction of the visible width.', '화살표를 한 번 누를 때 스크롤하는 거리. 보이는 폭에 대한 비율입니다.')],
  ['duration', 'number', '300', tx(
    'Scroll animation length in ms. <code>0</code> turns animation off.',
    '스크롤 애니메이션 시간(ms). <code>0</code>이면 애니메이션을 끕니다.',
  )],
  ['overscan', 'number', '120', tx('Extra px rendered past each edge.', '양쪽 가장자리 밖으로 미리 그려 두는 폭(px).')],
  ['classNames', 'Partial&lt;ClassNames&gt;', '–', tx('Classes appended to the built-in ones. See below.', '기본 클래스 뒤에 덧붙일 클래스. 아래 표를 참고하세요.')],
  ['labels', '{ root, prev, next, page(n) }', tx('English', '영어'), tx('Accessible labels, for i18n.', '스크린리더용 라벨(다국어 지원용).')],
  ['prevIcon / nextIcon', tx('string (HTML)', '문자열 (HTML)'), tx('SVG chevron', 'SVG 화살표'), tx('Trusted markup for the arrow buttons.', '화살표 버튼에 넣을 마크업. 신뢰할 수 있는 값만 넣으세요.')],
]);

table('methods-table', [tx('Method', '메서드'), tx('Description', '설명')], [
  ['setActive(page, { scroll?, animate? })', tx(
    'Change the current page <em>without</em> calling <code>onChange</code>. Centers it unless <code>scroll: false</code>.',
    '현재 페이지를 바꾸되 <code>onChange</code>는 <em>호출하지 않습니다</em>. <code>scroll: false</code>가 아니면 가운데로 스크롤합니다.',
  )],
  ['goTo(page)', tx(
    'Change the current page like a user would: centers it and calls <code>onChange</code> if the page changed.',
    '사용자가 고른 것처럼 페이지를 바꿉니다. 가운데로 스크롤하고, 페이지가 바뀌었으면 <code>onChange</code>를 호출합니다.',
  )],
  ['scrollPrev() / scrollNext()', tx(
    'Same as the arrows. Calls during an animation add up, so repeated presses keep going.',
    '화살표 버튼과 같습니다. 애니메이션 중에 다시 호출하면 거리가 누적되어 계속 이어집니다.',
  )],
  ['scrollToPage(page, { animate? })', tx('Center any page without selecting it.', '선택하지 않고 원하는 페이지를 가운데로 스크롤합니다.')],
  ['scrollToActive({ animate? })', tx('Center the current page.', '현재 페이지를 가운데로 스크롤합니다.')],
  ['update(options)', tx(
    'Change options. Only the keys you pass change. <code>active</code> is applied only when the value you pass changes.',
    '옵션을 바꿉니다. 넘긴 키만 바뀝니다. <code>active</code>는 넘긴 값이 이전과 달라졌을 때만 적용됩니다.',
  )],
  ['refresh()', tx(
    'Measure the items again after a font or theme change. Web fonts are handled automatically.',
    '폰트나 테마가 바뀐 뒤 아이템 폭을 다시 잽니다. 웹폰트 로딩은 자동으로 처리됩니다.',
  )],
  ['getActive() / getTotal()', tx('Current state.', '현재 상태.')],
  ['getVisibleRange()', tx(
    '<code>{ start, end }</code> of the pages in view, or <code>null</code> while the strip is hidden.',
    '화면에 보이는 페이지의 <code>{ start, end }</code>. 숨겨져 있으면 <code>null</code>.',
  )],
  ['destroy()', tx('Remove the DOM and stop observing.', 'DOM을 제거하고 크기 감지를 멈춥니다.')],
  ['root', tx('The <code>&lt;nav&gt;</code> element (read-only property).', '<code>&lt;nav&gt;</code> 요소(읽기 전용 속성).')],
]);

table('vars-table', [tx('Variable', '변수'), tx('Default', '기본값'), tx('Description', '설명')], [
  ['--sp-gap', tx('theme', '테마마다 다름'), tx(
    'Space between items. The core reads it when measuring, so it can be negative (collapsed borders).',
    '아이템 사이 간격. 코어가 측정할 때 읽으므로 음수(테두리 겹치기)도 됩니다.',
  )],
  ['--sp-fade', '24px', tx(
    'Width of the edge fade. It uses a mask, so it works on any background, and only appears on a side that has more pages. <code>0</code> turns it off.',
    '양끝 페이드 폭. mask 방식이라 어떤 배경에서도 동작하고, 더 넘길 페이지가 있는 쪽에만 나타납니다. <code>0</code>이면 끕니다.',
  )],
  ['--sp-size', '2.25rem', tx('Item height and minimum width (default theme).', '아이템 높이와 최소 폭(기본 테마).')],
  ['--sp-padding-x', '0.625rem', tx('Horizontal item padding (default theme).', '아이템 좌우 안쪽 여백(기본 테마).')],
  ['--sp-radius', '0.5rem', tx('Item corner radius (default theme).', '아이템 모서리 둥글기(기본 테마).')],
  ['--sp-font-size', '0.9375rem', tx('Font size (default theme).', '글자 크기(기본 테마).')],
  ['--sp-hover-bg', 'currentColor 9%', tx('Hover background (default theme).', '마우스를 올렸을 때 배경(기본 테마).')],
  ['--sp-active-bg / --sp-active-color', '#2563eb / #fff', tx('Current page colors (default theme).', '현재 페이지 색상(기본 테마).')],
  ['--sp-focus-ring', '#2563eb', tx('Keyboard focus outline (default theme).', '키보드 포커스 테두리(기본 테마).')],
]);

table('classes-table', [tx('Key', '키'), tx('Built-in class', '기본 클래스'), tx('Element', '요소')], [
  ['root', 'swipe-pagination', tx('&lt;nav&gt; wrapper', '&lt;nav&gt; 감싸는 요소')],
  ['arrow', 'swipe-pagination__arrow', tx('Both arrow buttons', '양쪽 화살표 버튼')],
  ['prev / next', 'swipe-pagination__arrow--prev / --next', tx('One arrow button', '각 화살표 버튼')],
  ['viewport', 'swipe-pagination__viewport', tx('Scrolling area', '스크롤 영역')],
  ['track', 'swipe-pagination__track', tx('Full-width inner track', '전체 폭의 내부 트랙')],
  ['item', 'swipe-pagination__item', tx('Every page', '모든 페이지')],
  ['active', 'swipe-pagination__item--active', tx(
    'Current page (also has <code>aria-current="page"</code>)',
    '현재 페이지(<code>aria-current="page"</code>도 붙음)',
  )],
  ['inactive', '–', tx(
    'Every page except the current one. Handy for utility classes.',
    '현재 페이지를 뺀 나머지 페이지. 유틸리티 클래스를 쓸 때 유용합니다.',
  )],
]);

// ---------------------------------------------------------------- copy buttons & dark mode

document.addEventListener('click', async (event) => {
  const button = (event.target as HTMLElement).closest<HTMLElement>('.copy');
  if (!button?.dataset.copy) return;
  try {
    await navigator.clipboard.writeText(button.dataset.copy);
    button.textContent = tx('Copied', '복사됨');
  } catch {
    button.textContent = tx('Press ⌘C', '⌘C를 누르세요');
  }
  setTimeout(() => (button.textContent = tx('Copy', '복사')), 1500);
});

$('#theme-toggle').addEventListener('click', () => {
  const root = document.documentElement;
  const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = dark ? 'light' : 'dark';
  try {
    localStorage.setItem('sp-demo-theme', root.dataset.theme);
  } catch {}
});
