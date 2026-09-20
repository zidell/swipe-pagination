# swipe-pagination

**Pagination you can swipe.** A responsive line of page numbers that you scroll through instead of stepping through one page at a time. Thousands of pages fit on one line, and only the numbers on screen are rendered.

[![npm](https://img.shields.io/npm/v/swipe-pagination)](https://www.npmjs.com/package/swipe-pagination)
[![bundle size](https://img.shields.io/bundlephobia/minzip/swipe-pagination)](https://bundlephobia.com/package/swipe-pagination)
[![license](https://img.shields.io/npm/l/swipe-pagination)](./LICENSE)

**[Live demo & playground →](https://zidell.github.io/swipe-pagination/)**

- **No detours.** To go from page 1 to page 50, swipe (or tap the arrows a few times) and pick page 50. You don't load every page in between.
- **One line at any width.** Even at 320px or with page numbers in the thousands, the strip never wraps. A wider container just shows more pages.
- **Thousands of pages, few nodes.** It uses virtual rendering, and each number is only as wide as its digits. With 1,000,000 pages there are still about 20 elements in the DOM.
- **Native feel.** It uses the browser's own touch, trackpad and momentum scrolling. Tapping an arrow several times quickly moves further instead of restarting the animation.
- **Fades only where more pages are.** The edge fade is a CSS mask, so it works on any background: solid, gradient or image.
- **Accessible.** It renders a `<nav>` with `<button>`s (or `<a href>` links) and `aria-current="page"`, and supports ← → Home End.
- **Any stack.** The core has zero dependencies. It ships React 17–19, Vue 3 and Svelte 3/4/5 components and themes for Bootstrap 5, daisyUI, shadcn/ui, Bulma, Pico and Mantine, and works with Tailwind through `classNames`.

## Install

```bash
npm i swipe-pagination
```

## Supported versions

| Library | Versions | Import |
| --- | --- | --- |
| None — vanilla JS/TS | – | `swipe-pagination` |
| React | 17, 18, 19 | `swipe-pagination/react` (or `/react17`, `/react18`, `/react19`) |
| Vue | 3.3+ | `swipe-pagination/vue` (or `/vue3`) |
| Svelte | 5 | `swipe-pagination/svelte` (or `/svelte5`) |
| Svelte | 4 | `swipe-pagination/svelte4` |
| Svelte | 3 | `swipe-pagination/svelte3` |

The unnumbered path (`/react`, `/vue`, `/svelte`) is always the newest major. The numbered paths name the version you are on; when you upgrade, update the package and move the import back to the unnumbered one.

`/svelte` is a runes component, so it also works in an app compiled with `runes: true`. `/svelte4` and `/svelte3` load the pre-runes component instead — the same file for both, with separate declarations because `SvelteComponent` only became generic in Svelte 4 and Svelte 3 spells it `SvelteComponentTyped`.

## Quick start

### Vanilla JS

```js
import { SwipePagination } from 'swipe-pagination';
import 'swipe-pagination/style.css';

const pager = new SwipePagination(document.querySelector('#pager'), {
  total: 5000,
  active: 1,
  onChange(page) {
    loadPage(page);
  },
});
```

### React

```tsx
import { useState } from 'react';
import { SwipePagination } from 'swipe-pagination/react';
import 'swipe-pagination/style.css';

export function Posts({ total }: { total: number }) {
  const [page, setPage] = useState(1);
  return <SwipePagination total={total} active={page} onChange={setPage} />;
}
```

The component is marked `"use client"`, so it works in the Next.js App Router. Pass a `ref` to get the [core instance](#methods):

```tsx
const pager = useRef<SwipePaginationInstance>(null);
<SwipePagination ref={pager} total={total} />;
pager.current?.scrollToActive();
```

### Vue 3

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { SwipePagination } from 'swipe-pagination/vue';
import 'swipe-pagination/style.css';

const page = ref(1);
</script>

<template>
  <SwipePagination :total="5000" v-model:active="page" @change="loadPage" />
</template>
```

Emits `update:active` and `change(page, event)`. Get the instance with a template ref: `pager.value.getInstance()`.

### Svelte

```svelte
<script>
  import { SwipePagination } from 'swipe-pagination/svelte';
  import 'swipe-pagination/style.css';

  let page = $state(1);
</script>

<SwipePagination total={5000} bind:active={page} onChange={loadPage} />
```

On Svelte 4 and 3, import from `swipe-pagination/svelte4` or `swipe-pagination/svelte3` and write `let page = 1` — everything else is the same.

Get the instance with `bind:this={pager}` and then `pager.getInstance()`.

### CDN

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swipe-pagination/dist/style.css" />
<script src="https://cdn.jsdelivr.net/npm/swipe-pagination/dist/swipe-pagination.iife.js"></script>

<div id="pager"></div>
<script>
  new SwipePagination(document.getElementById('pager'), { total: 300 });
</script>
```

### Links (SSR, multi-page apps, SEO)

Pass `href` to render real links, so crawlers, middle-click and "open in new tab" work.

```js
new SwipePagination(el, {
  total: 120,
  active: currentPage,
  href: (page) => `/posts?page=${page}`,
});
```

In a SPA you can keep the links and route on the client:

```js
new SwipePagination(el, {
  total: 120,
  href: (page) => `/posts?page=${page}`,
  onChange(page, event) {
    event?.preventDefault();
    router.push(`/posts?page=${page}`);
  },
});
```

Clicks with a modifier key (⌘/Ctrl/Shift/Alt) are left to the browser and don't change the current page.

## Themes

Import **one** stylesheet. Each file already includes the structural CSS. The library themes read that library's CSS variables, so your colors, radius and dark mode carry over automatically.

| Stylesheet | For |
| --- | --- |
| `swipe-pagination/style.css` | Default theme. Uses `currentColor`, so it fits light and dark pages. |
| `swipe-pagination/themes/bootstrap5.css` | Bootstrap 5 (`--bs-*`, `data-bs-theme`) |
| `swipe-pagination/themes/daisyui.css` | daisyUI 5 (`--color-*`, `--radius-field`) |
| `swipe-pagination/themes/shadcn.css` | shadcn/ui (`--primary`, `--accent`, `--ring`, `--radius`) |
| `swipe-pagination/themes/bulma.css` | Bulma 1 (`--bulma-*`) |
| `swipe-pagination/themes/pico.css` | Pico CSS 2 (`--pico-*`). Overrides Pico's global `button` styles. |
| `swipe-pagination/themes/mantine.css` | Mantine 7+ (`--mantine-*`) |
| `swipe-pagination/base.css` | Structure only. Use it with your own CSS or utility classes. |

### Tailwind CSS (and other utility-first CSS)

Use `base.css` and pass utility classes through `classNames`. The `active` and `inactive` keys let you give the current page and the other pages different colors without conflicts.

```js
import 'swipe-pagination/base.css';

new SwipePagination(el, {
  total: 250,
  classNames: {
    root: '[--sp-gap:6px] gap-1.5',
    arrow: 'size-9 rounded-full text-slate-500 hover:bg-slate-100 disabled:opacity-30',
    item: 'h-9 min-w-9 px-3 rounded-full text-sm font-semibold',
    inactive: 'text-slate-600 hover:bg-slate-100',
    active: 'bg-violet-600 text-white',
  },
});
```

The same approach works for Flowbite, UnoCSS, or your own component classes, e.g. `item: 'btn btn-sm'` with daisyUI.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `total` | `number` | `1` | Number of pages. |
| `active` | `number` | `1` | Current page, 1-based. Clamped to `1…total`. |
| `onChange` | `(page, event?) => void` | – | Runs when the user picks a page (click, tap, Enter) or `goTo()` changes it. `event` is the DOM event, if there is one. |
| `href` | `(page) => string` | – | Render pages as `<a href>` links. |
| `sideMargin` | `number` | `8` | Space before the first and after the last page, in px. |
| `scrollStep` | `number` | `0.9` | Arrow scroll distance as a fraction of the visible width. |
| `duration` | `number` | `300` | Scroll animation length in ms. `0` turns animation off. |
| `overscan` | `number` | `120` | Extra px rendered past each edge. |
| `classNames` | `Partial<ClassNames>` | – | Classes appended to the built-in ones ([see below](#class-names)). |
| `labels` | `{ root, prev, next, page(n) }` | English | Accessible labels, e.g. `{ prev: '이전', next: '다음', page: (n) => \`${n}페이지\` }`. |
| `prevIcon` / `nextIcon` | `string` (HTML) | SVG chevron | Trusted markup for the arrows, e.g. `'<i class="bi bi-chevron-left"></i>'`. |

Framework components accept the same options as props. They also accept `className`/`style` (React) or `class`/`style` (Vue, Svelte) for the host element.

## Methods

```js
const pager = new SwipePagination(el, options);
```

| Method | Description |
| --- | --- |
| `setActive(page, { scroll = true, animate = true })` | Change the current page **without** calling `onChange`. Use it to sync with state from elsewhere. |
| `goTo(page)` | Change the page like a user would: center it and call `onChange` if the page changed. |
| `scrollPrev()` / `scrollNext()` | Same as the arrows. Calls during an animation add up. |
| `scrollToPage(page, { animate = true })` | Center any page without selecting it. |
| `scrollToActive({ animate = true })` | Center the current page. |
| `update(options)` | Change options. Only the keys you pass change. `active` is applied only when the value you pass differs from the last one you passed, so re-rendering with a stale value won't undo a user's pick. |
| `refresh()` | Measure the items again after a theme or font change. Web fonts loading after start are handled automatically. |
| `getActive()` / `getTotal()` | Current state. |
| `getVisibleRange()` | `{ start, end }` of the pages in view, or `null` while hidden. |
| `destroy()` | Remove the DOM and stop observing. |
| `root` | The `<nav>` element (read-only). |

`onChange` vs `setActive`: user actions and `goTo()` call `onChange`. `setActive()` and `update({ active })` never do, so feeding your own state back in can't cause a loop.

## Styling

### CSS variables

| Variable | Default | Description |
| --- | --- | --- |
| `--sp-gap` | theme | Space between items. The core reads it when measuring, so negative values (collapsed borders) work. |
| `--sp-fade` | `24px` | Width of the edge fade. It only appears on a side that has more pages. `0` turns it off. |
| `--sp-size` | `2.25rem` | Item height and minimum width *(default theme)* |
| `--sp-padding-x` | `0.625rem` | Horizontal item padding *(default theme)* |
| `--sp-radius` | `0.5rem` | Corner radius *(default theme)* |
| `--sp-font-size` | `0.9375rem` | Font size *(default theme)* |
| `--sp-hover-bg` | `currentColor` 9% | Hover background *(default theme)* |
| `--sp-active-bg` / `--sp-active-color` | `#2563eb` / `#fff` | Current page *(default theme)* |
| `--sp-focus-ring` | `#2563eb` | Keyboard focus outline *(default theme)* |

```css
.swipe-pagination {
  --sp-active-bg: hotpink;
  --sp-radius: 999px;
}
```

### Class names

The built-in classes are always present. `classNames` entries are appended.

| Key | Built-in class | Element |
| --- | --- | --- |
| `root` | `swipe-pagination` | `<nav>` wrapper |
| `arrow` | `swipe-pagination__arrow` | Both arrows |
| `prev` / `next` | `swipe-pagination__arrow--prev` / `--next` | One arrow |
| `viewport` | `swipe-pagination__viewport` | Scrolling area |
| `track` | `swipe-pagination__track` | Full-width inner track |
| `item` | `swipe-pagination__item` | Every page |
| `active` | `swipe-pagination__item--active` | Current page (also `aria-current="page"`) |
| `inactive` | – | Every other page |

State attributes for CSS: `nav[data-at-start]`, `nav[data-at-end]` (both present means every page fits), and `.swipe-pagination__arrow:disabled`.

## Layout notes

- The scrollbar is hidden on every platform, including Windows where scrollbars are always visible. Scrolling still works.
- The strip fills its container's width. In a flex row, give the host `flex: 1; min-width: 0` (or a width), just as you would for an input.
- The track can be millions of pixels wide, but it never stretches grid, flex or table ancestors (`contain: inline-size`).
- Starting inside a hidden container (a tab or modal) is fine. It lays itself out when it becomes visible.
- Very large totals are fine too. Past browser element-size limits (~10M px), scroll positions are scaled internally.

## Browser support

Current evergreen browsers: Chrome/Edge 105+, Safari 15.4+, Firefox 101+ (needs `ResizeObserver`, CSS `mask-image` and `contain: inline-size`).

## How it works

1. **A native scroll area.** The numbers sit on one wide, empty track inside a horizontally scrolling box, so touch and momentum scrolling come from the browser.
2. **Width per digit count.** On start it measures one number of each length (`8`, `88`, `888`, …). Pages with the same number of digits share a width.
3. **Position ⇄ page in O(digits).** A page's left edge is a sum over digit tiers: page 15 is at `9 × w₁ + 5 × w₂`. The inverse turns a scroll position back into a page.
4. **Render what's visible.** On scroll, only the pages in view (plus overscan) are rendered as absolutely positioned elements, and elements are reused as they scroll.

Background story (Korean): [모바일을 위한 새로운 페이지네이션](https://maxzidell.medium.com/c4252df8dca7).

## Development

```bash
npm i
npm run dev         # demo at http://localhost:5173 with live source
npm test            # vitest (jsdom); Svelte 5, 4 and a Svelte 3 compile/mount test
npm run coverage    # 100% coverage is enforced
npm run typecheck   # the repo, plus each Svelte entry against its own major
npm run build       # dist/ (ESM, CJS, IIFE, types, CSS, Svelte)
npm run build:demo  # demo/dist
```

Releasing: bump `version` in `package.json`, commit, then `git tag v0.2.0 && git push --tags`. CI tests, publishes to npm and deploys the demo.

## License

[MIT](./LICENSE)
