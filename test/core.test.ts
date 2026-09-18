import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SwipePagination, type SwipePaginationOptions } from '../src';
import { MockResizeObserver, metrics, resize } from './setup';

// With the fake metrics: 1-digit items are 22px, 2-digit 30px, 3-digit 38px; viewport 200px; sideMargin 8px.
// For total=100, active=50 the active page is centered at scrollLeft 1321 and pages 43–57 are rendered.

function setup(options: SwipePaginationOptions = {}, host = document.createElement('div')) {
  if (!host.isConnected) document.body.append(host);
  const sp = new SwipePagination(host, options);
  const root = sp.root;
  const viewport = root.querySelector<HTMLElement>('.swipe-pagination__viewport')!;
  const track = root.querySelector<HTMLElement>('.swipe-pagination__track')!;
  const prev = root.querySelector<HTMLButtonElement>('.swipe-pagination__arrow--prev')!;
  const next = root.querySelector<HTMLButtonElement>('.swipe-pagination__arrow--next')!;
  const items = () => [...track.querySelectorAll<HTMLElement>('.swipe-pagination__item')];
  const pages = () => items().map((el) => Number(el.dataset.page));
  const item = (page: number) => track.querySelector<HTMLElement>(`[data-page="${page}"]`);
  const current = () => track.querySelector<HTMLElement>('[aria-current="page"]');
  return { host, sp, root, viewport, track, prev, next, items, pages, item, current };
}

const range = (start: number, end: number) => Array.from({ length: end - start + 1 }, (_, i) => start + i);

function userScroll(viewport: HTMLElement, left: number) {
  viewport.scrollLeft = left;
  viewport.dispatchEvent(new Event('scroll'));
}

function press(el: HTMLElement, key: string) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  el.dispatchEvent(event);
  return event;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'Date', 'setTimeout'] });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('construction', () => {
  it('builds an accessible nav inside the host', () => {
    const { host, root, prev, next, viewport, track } = setup({ total: 100, active: 50 });
    expect(host.firstElementChild).toBe(root);
    expect(root.tagName).toBe('NAV');
    expect(root.className).toBe('swipe-pagination');
    expect(root.getAttribute('aria-label')).toBe('Pagination');
    expect([...root.children]).toEqual([prev, viewport, next]);
    expect(viewport.firstElementChild).toBe(track);
    expect(prev.type).toBe('button');
    expect(prev.getAttribute('aria-label')).toBe('Previous pages');
    expect(next.getAttribute('aria-label')).toBe('Next pages');
    expect(prev.querySelector('svg')).not.toBeNull();
    expect(next.querySelector('svg')).not.toBeNull();
  });

  it('sizes the track from measured items', () => {
    const { track } = setup({ total: 100, active: 50 });
    expect(track.style.width).toBe(`${8 + 9 * 22 + 90 * 30 + 38 + 8}px`);
    expect(track.style.height).toBe('30px');
  });

  it('centers the active page and renders only the visible pages plus overscan', () => {
    const { sp, viewport, pages, current, item } = setup({ total: 100, active: 50 });
    expect(viewport.scrollLeft).toBe(1321);
    expect(pages()).toEqual(range(43, 57));
    expect(current()?.dataset.page).toBe('50');
    expect(item(50)?.classList.contains('swipe-pagination__item--active')).toBe(true);
    expect(item(49)?.classList.contains('swipe-pagination__item--active')).toBe(false);
    expect(item(50)?.style.left).toBe(`${8 + 9 * 22 + 40 * 30}px`);
    expect(item(50)?.style.width).toBe('30px');
    expect(item(50)?.getAttribute('aria-label')).toBe('Page 50');
    expect(sp.getVisibleRange()).toEqual({ start: 47, end: 53 });
  });

  it('renders pages as buttons with their number', () => {
    const onChange = vi.fn();
    const { item, root } = setup({ total: 20, onChange });
    const el = item(3) as HTMLButtonElement;
    expect(el.tagName).toBe('BUTTON');
    expect(el.type).toBe('button');
    expect(el.textContent).toBe('3');
    root.click();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders only the visible pages with overscan 0', () => {
    expect(setup({ total: 100, active: 50, overscan: 0 }).pages()).toEqual(range(47, 53));
  });

  it('uses defaults and clamps invalid input', () => {
    expect(setup().sp.getTotal()).toBe(1);
    expect(setup().sp.getActive()).toBe(1);
    expect(setup({ total: 0, active: -3 }).sp.getTotal()).toBe(1);
    expect(setup({ total: Number.NaN }).sp.getTotal()).toBe(1);
    const clamped = setup({ total: 10.7, active: 99 });
    expect(clamped.sp.getTotal()).toBe(10);
    expect(clamped.sp.getActive()).toBe(10);
    expect(setup({ total: 10, active: Number.NaN }).sp.getActive()).toBe(1);
  });

  it('disables the arrow on the side with nothing left to scroll', () => {
    const start = setup({ total: 100, active: 1 });
    expect(start.viewport.scrollLeft).toBe(0);
    expect(start.prev.disabled).toBe(true);
    expect(start.next.disabled).toBe(false);
    expect(start.root.hasAttribute('data-at-start')).toBe(true);
    expect(start.root.hasAttribute('data-at-end')).toBe(false);

    const end = setup({ total: 100, active: 100 });
    expect(end.prev.disabled).toBe(false);
    expect(end.next.disabled).toBe(true);
    expect(end.root.hasAttribute('data-at-end')).toBe(true);
  });

  it('disables both arrows when every page fits', () => {
    const { prev, next, pages, viewport } = setup({ total: 5, active: 3 });
    expect(pages()).toEqual(range(1, 5));
    expect(viewport.scrollLeft).toBe(0);
    expect(prev.disabled && next.disabled).toBe(true);
  });

  it('reads the item gap from the --sp-gap custom property', () => {
    const style = document.createElement('style');
    style.textContent = '.swipe-pagination { --sp-gap: 4px; }';
    document.head.append(style);
    try {
      const { track, item } = setup({ total: 12 });
      expect(item(2)?.style.left).toBe(`${8 + 26}px`);
      expect(track.style.width).toBe(`${8 + 9 * 26 + 2 * 34 + 30 + 8}px`);
    } finally {
      style.remove();
    }
  });

  it('works without ResizeObserver or document.fonts (e.g. other test environments)', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const { sp, pages } = setup({ total: 30, active: 15 });
    expect(pages().length).toBeGreaterThan(0);
    expect(() => sp.destroy()).not.toThrow();
    vi.unstubAllGlobals();
  });
});

describe('scrolling', () => {
  it('recycles items as the user scrolls, keeping DOM order equal to page order', () => {
    const { viewport, pages, items, prev } = setup({ total: 100, active: 50 });
    const kept = items().find((el) => el.dataset.page === '45');

    userScroll(viewport, 1200);
    expect(pages()).toEqual(range(39, 53));
    expect(items().find((el) => el.dataset.page === '45')).toBe(kept);

    userScroll(viewport, 1400);
    expect(pages()).toEqual(range(45, 60));

    userScroll(viewport, 0);
    expect(pages()).toEqual(range(1, 13));
    expect(prev.disabled).toBe(true);
  });

  it('scrolls one step per arrow press with an eased animation', () => {
    const { viewport, next, prev } = setup({ total: 100, active: 50 });
    next.click();
    vi.advanceTimersByTime(100);
    const midway = viewport.scrollLeft;
    expect(midway).toBeGreaterThan(1321);
    expect(midway).toBeLessThan(1321 + 180);
    vi.advanceTimersByTime(300);
    expect(viewport.scrollLeft).toBe(1321 + 180);

    prev.click();
    vi.advanceTimersByTime(400);
    expect(viewport.scrollLeft).toBe(1321);
  });

  it('accumulates rapid presses instead of restarting from the current position', () => {
    const { viewport, next } = setup({ total: 100, active: 50 });
    next.click();
    vi.advanceTimersByTime(50);
    next.click();
    next.click();
    vi.advanceTimersByTime(400);
    expect(viewport.scrollLeft).toBe(1321 + 3 * 180);
  });

  it('clamps to the ends', () => {
    const { viewport, sp, next } = setup({ total: 100, active: 95 });
    sp.scrollNext();
    vi.advanceTimersByTime(400);
    expect(viewport.scrollLeft).toBe(2952 - 200);
    expect(next.disabled).toBe(true);
    sp.scrollToPage(1);
    vi.advanceTimersByTime(400);
    expect(viewport.scrollLeft).toBe(0);
  });

  it('respects scrollStep and duration options', () => {
    const { viewport, sp } = setup({ total: 100, active: 50, scrollStep: 0.5, duration: 0 });
    sp.scrollNext();
    expect(viewport.scrollLeft).toBe(1321 + 100);
    sp.scrollPrev();
    expect(viewport.scrollLeft).toBe(1321);
  });

  it('jumps without animating when the user prefers reduced motion', () => {
    let reduce = true;
    const matchMedia = vi.fn((query: string) => ({ matches: reduce && query === '(prefers-reduced-motion: reduce)' }));
    vi.stubGlobal('matchMedia', matchMedia);
    try {
      const { viewport, sp } = setup({ total: 100, active: 50 });
      sp.scrollNext();
      expect(viewport.scrollLeft).toBe(1321 + 180);

      // Read on every scroll, so changing the OS setting applies right away.
      reduce = false;
      sp.scrollNext();
      expect(viewport.scrollLeft).toBe(1321 + 180);
      vi.advanceTimersByTime(400);
      expect(viewport.scrollLeft).toBe(1321 + 360);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('stops animating when the user grabs the strip', () => {
    const { viewport, next } = setup({ total: 100, active: 50 });
    next.click();
    vi.advanceTimersByTime(100);
    viewport.dispatchEvent(new Event('pointerdown'));
    const grabbed = viewport.scrollLeft;
    vi.advanceTimersByTime(400);
    expect(viewport.scrollLeft).toBe(grabbed);
    viewport.dispatchEvent(new Event('wheel'));
    expect(viewport.scrollLeft).toBe(grabbed);
  });

  it('scrolls to any page without changing the active one', () => {
    const { viewport, sp } = setup({ total: 100, active: 50 });
    sp.scrollToPage(80, { animate: false });
    expect(viewport.scrollLeft).toBe(8 + 9 * 22 + 70 * 30 + 15 - 100);
    expect(sp.getActive()).toBe(50);
    sp.scrollToActive({ animate: false });
    expect(viewport.scrollLeft).toBe(1321);
    sp.scrollToPage(999, { animate: false });
    expect(viewport.scrollLeft).toBe(2952 - 200);
  });

  it('scales scroll coordinates when the track would exceed browser size limits', () => {
    SwipePagination.maxTrackWidth = 1000;
    const { viewport, track, item, sp, next } = setup({ total: 100, active: 50, duration: 0 });
    expect(track.style.width).toBe('1000px');
    const onScreen = (page: number) => parseFloat(item(page)!.style.left) - viewport.scrollLeft;
    expect(onScreen(50)).toBeCloseTo(85);
    expect(sp.getVisibleRange()).toEqual({ start: 47, end: 53 });

    next.click();
    expect(onScreen(50)).toBeCloseTo(85 - 180);
    sp.scrollToPage(100);
    expect(viewport.scrollLeft).toBeCloseTo(800);
    expect(next.disabled).toBe(true);
  });
});

describe('selection', () => {
  it('selects a clicked page, calls onChange and centers it', () => {
    const onChange = vi.fn();
    const { item, current, viewport, sp } = setup({ total: 100, active: 50, onChange });
    item(52)!.click();
    expect(onChange).toHaveBeenCalledWith(52, expect.any(MouseEvent));
    expect(sp.getActive()).toBe(52);
    expect(current()?.dataset.page).toBe('52');
    expect(item(50)?.hasAttribute('aria-current')).toBe(false);
    vi.advanceTimersByTime(400);
    expect(viewport.scrollLeft).toBe(8 + 9 * 22 + 42 * 30 + 15 - 100);
  });

  it('ignores clicks on the current page and outside items', () => {
    const onChange = vi.fn();
    const outer = document.createElement('div');
    outer.dataset.page = '7';
    const host = document.createElement('div');
    outer.append(host);
    document.body.append(outer);
    const { item, root, track } = setup({ total: 100, active: 50, onChange }, host);
    item(50)!.click();
    root.click();
    track.click();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('setActive changes the page silently', () => {
    const onChange = vi.fn();
    const { sp, current, viewport } = setup({ total: 100, active: 50, onChange });
    sp.setActive(51, { scroll: false });
    expect(current()?.dataset.page).toBe('51');
    expect(viewport.scrollLeft).toBe(1321);

    sp.setActive(90, { animate: false });
    expect(viewport.scrollLeft).toBe(8 + 9 * 22 + 80 * 30 + 15 - 100);
    expect(current()?.dataset.page).toBe('90');

    sp.setActive(90);
    sp.setActive(5000, { animate: false });
    expect(sp.getActive()).toBe(100);

    userScroll(viewport, 0);
    sp.setActive(3, { scroll: false });
    expect(current()?.dataset.page).toBe('3');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('goTo behaves like a user selection', () => {
    const onChange = vi.fn();
    const { sp } = setup({ total: 100, active: 50, onChange });
    sp.goTo(10);
    expect(onChange).toHaveBeenCalledWith(10, undefined);
    sp.goTo(10);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(() => setup({ total: 3 }).sp.goTo(2)).not.toThrow();
  });

  it('renders links when href is given', () => {
    const onChange = vi.fn((_page: number, event?: Event) => event?.preventDefault());
    const { item } = setup({ total: 20, active: 1, href: (page) => `/posts?page=${page}`, onChange });
    const link = item(4) as HTMLAnchorElement;
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/posts?page=4');

    link.click();
    expect(onChange).toHaveBeenCalledWith(4, expect.any(MouseEvent));
  });

  it('leaves modified link clicks (new tab) to the browser', () => {
    const onChange = vi.fn();
    const { item, sp } = setup({ total: 20, active: 1, href: (page) => `#p${page}`, onChange });
    for (const modifier of ['metaKey', 'ctrlKey', 'shiftKey', 'altKey']) {
      item(4)!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, [modifier]: true }));
    }
    expect(onChange).not.toHaveBeenCalled();
    expect(sp.getActive()).toBe(1);
  });
});

describe('keyboard', () => {
  it('moves focus between pages with arrow keys, Home and End', () => {
    const { item, viewport } = setup({ total: 100, active: 50 });
    item(50)!.focus();

    const event = press(item(50)!, 'ArrowRight');
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(item(51));
    expect(viewport.scrollLeft).toBe(1321);

    press(item(53)!, 'ArrowRight');
    expect(document.activeElement).toBe(item(54));
    expect(viewport.scrollLeft).toBe(8 + 9 * 22 + 44 * 30 + 30 + 8 - 200);

    press(item(54)!, 'Home');
    expect(document.activeElement).toBe(item(1));
    expect(viewport.scrollLeft).toBe(0);

    press(item(1)!, 'ArrowLeft');
    expect(document.activeElement).toBe(item(1));

    press(item(1)!, 'End');
    expect(document.activeElement).toBe(item(100));
    expect(viewport.scrollLeft).toBe(2952 - 200);

    press(item(100)!, 'ArrowLeft');
    expect(document.activeElement).toBe(item(99));
  });

  it('reveals a page hidden on the left', () => {
    const { item, viewport } = setup({ total: 100, active: 50 });
    press(item(47)!, 'ArrowLeft');
    expect(document.activeElement).toBe(item(46));
    expect(viewport.scrollLeft).toBe(9 * 22 + 36 * 30);
  });

  it('ignores other keys and keys outside items', () => {
    const { item, viewport } = setup({ total: 100, active: 50 });
    expect(press(item(50)!, 'a').defaultPrevented).toBe(false);
    expect(press(viewport, 'ArrowRight').defaultPrevented).toBe(false);
  });
});

describe('update', () => {
  it('changes total, clamping the active page and re-laying out', () => {
    const { sp, pages, prev, next } = setup({ total: 100, active: 50 });
    sp.update({ total: 5 });
    expect(sp.getTotal()).toBe(5);
    expect(sp.getActive()).toBe(5);
    expect(pages()).toEqual(range(1, 5));
    expect(prev.disabled && next.disabled).toBe(true);
  });

  it('keeps the centered page when only the side margin changes', () => {
    const { sp, viewport } = setup({ total: 100, active: 50 });
    sp.update({ sideMargin: 20 });
    expect(viewport.scrollLeft).toBe(20 + 9 * 22 + 40 * 30 + 15 - 100);
  });

  it('applies custom class names, including active/inactive state classes', () => {
    const { sp, root, viewport, track, prev, next, item } = setup({ total: 100, active: 50 });
    sp.update({
      classNames: {
        root: 'r',
        viewport: 'v',
        track: 't',
        arrow: 'a',
        prev: 'p',
        next: 'n',
        item: 'i  j',
        active: 'on bold',
        inactive: 'off',
      },
    });
    expect(root.className).toBe('swipe-pagination r');
    expect(viewport.className).toBe('swipe-pagination__viewport v');
    expect(track.className).toBe('swipe-pagination__track t');
    expect(prev.className).toBe('swipe-pagination__arrow a swipe-pagination__arrow--prev p');
    expect(next.className).toBe('swipe-pagination__arrow a swipe-pagination__arrow--next n');
    expect(item(50)!.className).toBe('swipe-pagination__item i j swipe-pagination__item--active on bold');
    expect(item(49)!.className).toBe('swipe-pagination__item i j off');

    item(49)!.click();
    expect(item(49)!.classList.contains('on')).toBe(true);
    expect(item(49)!.classList.contains('off')).toBe(false);
    expect(item(50)!.classList.contains('off')).toBe(true);
  });

  it('does not rebuild items when options are equal', () => {
    const { sp, item } = setup({ total: 100, active: 50, classNames: { item: 'x' } });
    const el = item(50);
    sp.update({ classNames: { item: 'x' }, total: 100, active: 50, prevIcon: undefined });
    sp.update({});
    expect(item(50)).toBe(el);
    sp.update({ classNames: undefined });
    expect(item(50)).not.toBe(el);
    expect(item(50)!.className).toBe('swipe-pagination__item swipe-pagination__item--active');
  });

  it('switches between buttons and links, and updates hrefs in place', () => {
    const { sp, item } = setup({ total: 100, active: 50 });
    sp.update({ href: (page) => `?page=${page}` });
    const link = item(50) as HTMLAnchorElement;
    expect(link.tagName).toBe('A');
    sp.update({ href: (page) => `/p/${page}` });
    expect(item(50)).toBe(link);
    expect(link.getAttribute('href')).toBe('/p/50');
    sp.update({ href: undefined });
    expect(item(50)!.tagName).toBe('BUTTON');
  });

  it('updates labels and icons', () => {
    const { sp, root, prev, next, item } = setup({ total: 100, active: 50 });
    sp.update({
      labels: { root: '페이지 이동', prev: '이전', next: '다음', page: (page) => `${page}페이지` },
      prevIcon: '<b>‹</b>',
      nextIcon: '<b>›</b>',
    });
    expect(root.getAttribute('aria-label')).toBe('페이지 이동');
    expect(prev.getAttribute('aria-label')).toBe('이전');
    expect(next.getAttribute('aria-label')).toBe('다음');
    expect(item(50)!.getAttribute('aria-label')).toBe('50페이지');
    expect(prev.innerHTML).toBe('<b>‹</b>');
    expect(next.innerHTML).toBe('<b>›</b>');
  });

  it('applies active only when the passed value changes', () => {
    const onChange = vi.fn();
    const { sp, item } = setup({ total: 100, active: 50, onChange });
    sp.update({ active: 60 });
    expect(sp.getActive()).toBe(60);
    expect(onChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(400);
    item(61)!.click();
    sp.update({ active: 60 });
    expect(sp.getActive()).toBe(61);
  });

  it('re-renders right away when overscan changes', () => {
    const { sp, pages } = setup({ total: 100, active: 50 });
    sp.update({ overscan: 0 });
    expect(pages()).toEqual(range(47, 53));
    sp.update({ overscan: 120 });
    expect(pages()).toEqual(range(43, 57));
  });

  it('refresh re-measures and keeps the centered page', () => {
    const { sp, viewport } = setup({ total: 100, active: 50 });
    sp.scrollToPage(70, { animate: false });
    sp.refresh();
    expect(viewport.scrollLeft).toBe(8 + 9 * 22 + 60 * 30 + 15 - 100);
  });
});

describe('resizing and visibility', () => {
  it('keeps the same point centered when the width changes', () => {
    const { viewport, pages } = setup({ total: 100, active: 50 });
    resize(300);
    expect(viewport.scrollLeft).toBe(1321 + 100 - 150);
    expect(pages()).toEqual(range(41, 59));
    resize(300);
    expect(viewport.scrollLeft).toBe(1271);
  });

  it('waits while hidden and lays out once it becomes visible', () => {
    metrics.hidden = true;
    const { sp, pages, viewport } = setup({ total: 100, active: 50 });
    expect(pages()).toEqual([]);
    expect(sp.getVisibleRange()).toBeNull();
    sp.scrollToPage(10);
    sp.refresh();
    sp.update({ sideMargin: 4 });
    viewport.dispatchEvent(new Event('scroll'));
    expect(pages()).toEqual([]);

    metrics.hidden = false;
    resize(200);
    expect(viewport.scrollLeft).toBe(4 + 9 * 22 + 40 * 30 + 15 - 100);
    expect(pages()).toContain(50);
  });

  it('re-measures when web fonts finish loading', async () => {
    let loaded!: () => void;
    const ready = new Promise<void>((resolve) => (loaded = resolve));
    Object.defineProperty(document, 'fonts', { configurable: true, value: { ready } });
    const refresh = vi.spyOn(SwipePagination.prototype, 'refresh');
    try {
      setup({ total: 100 });
      const destroyed = setup({ total: 100 });
      destroyed.sp.destroy();
      loaded();
      await ready;
      await Promise.resolve();
      expect(refresh).toHaveBeenCalledTimes(1);
    } finally {
      delete (document as { fonts?: unknown }).fonts;
    }
  });
});

describe('destroy', () => {
  it('removes the DOM, stops observing and cancels animations', () => {
    const { sp, host, next, viewport } = setup({ total: 100, active: 50 });
    next.click();
    vi.advanceTimersByTime(50);
    const at = viewport.scrollLeft;
    sp.destroy();
    vi.advanceTimersByTime(400);
    expect(viewport.scrollLeft).toBe(at);
    expect(host.childElementCount).toBe(0);
    expect(MockResizeObserver.instances.size).toBe(0);
  });
});
