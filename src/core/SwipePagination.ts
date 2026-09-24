import { createLayout, digitCount, type Layout } from './layout';

export interface SwipePaginationClassNames {
  root: string;
  arrow: string;
  prev: string;
  next: string;
  viewport: string;
  track: string;
  item: string;
  active: string;
  inactive: string;
}

export interface SwipePaginationLabels {
  root: string;
  prev: string;
  next: string;
  page: (page: number) => string;
}

export interface SwipePaginationOptions {
  /** Number of pages. Default `1`. */
  total?: number;
  /** Current page (1-based). Default `1`. */
  active?: number;
  /**
   * Called when the user picks a page (click, tap, keyboard) or `goTo()` changes it.
   * `event` is the originating DOM event, if any.
   */
  onChange?: (page: number, event?: Event) => void;
  /** Render pages as links. Plain clicks still call `onChange`. */
  href?: (page: number) => string;
  /** Space before the first and after the last page, in px. Default `8`. */
  sideMargin?: number;
  /** Arrow scroll distance as a fraction of the visible width. Default `0.9`. */
  scrollStep?: number;
  /** Scroll animation length in ms. `0` disables animation. Default `300`. */
  duration?: number;
  /** Extra px rendered beyond each visible edge. Default `120`. */
  overscan?: number;
  /** Extra classes appended to the built-in ones. */
  classNames?: Partial<SwipePaginationClassNames>;
  /** Accessible labels (i18n). */
  labels?: Partial<SwipePaginationLabels>;
  /** Trusted HTML for the arrow buttons. Defaults to inline SVG chevrons. */
  prevIcon?: string;
  nextIcon?: string;
}

export interface ScrollOptions {
  /** Default `true`. */
  animate?: boolean;
}

export interface SetActiveOptions extends ScrollOptions {
  /** Scroll the page to the center. Default `true`. */
  scroll?: boolean;
}

export interface VisibleRange {
  start: number;
  end: number;
}

const BASE_CLASSES: SwipePaginationClassNames = {
  root: 'swipe-pagination',
  arrow: 'swipe-pagination__arrow',
  prev: 'swipe-pagination__arrow--prev',
  next: 'swipe-pagination__arrow--next',
  viewport: 'swipe-pagination__viewport',
  track: 'swipe-pagination__track',
  item: 'swipe-pagination__item',
  active: 'swipe-pagination__item--active',
  inactive: '',
};

const DEFAULT_LABELS: SwipePaginationLabels = {
  root: 'Pagination',
  prev: 'Previous pages',
  next: 'Next pages',
  page: (page) => `Page ${page}`,
};

const chevron = (d: string) =>
  `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
const PREV_ICON = chevron('M10 3 5 8l5 5');
const NEXT_ICON = chevron('m6 3 5 5-5 5');

const DEFAULTS = { sideMargin: 8, scrollStep: 0.9, duration: 300, overscan: 120 };

const toTotal = (total: number | undefined) => Math.max(1, Math.floor(total ?? 1) || 1);
const clampPage = (page: number | undefined, total: number) =>
  Math.min(total, Math.max(1, Math.floor(page ?? 1) || 1));
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
function toggleClasses(el: Element, classes: string, on: boolean) {
  for (const token of classes.split(/\s+/)) if (token) el.classList.toggle(token, on);
}

function sameClassNames(a: SwipePaginationOptions['classNames'], b: SwipePaginationOptions['classNames']) {
  const keys = new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})]);
  for (const key of keys) {
    if (a?.[key as keyof SwipePaginationClassNames] !== b?.[key as keyof SwipePaginationClassNames]) return false;
  }
  return true;
}

export class SwipePagination {
  /**
   * Browsers cap element sizes (~17.9M px in Firefox). Beyond this the track is
   * shrunk and scroll positions are scaled back to virtual coordinates.
   */
  static maxTrackWidth = 10_000_000;

  readonly root: HTMLElement;
  private readonly prevButton: HTMLButtonElement;
  private readonly nextButton: HTMLButtonElement;
  private readonly viewport: HTMLDivElement;
  private readonly track: HTMLDivElement;
  private readonly items = new Map<number, HTMLElement>();
  private readonly icons = { prev: '', next: '' };

  private options: SwipePaginationOptions;
  private total: number;
  private active: number;
  private layout: Layout | null = null;
  private contentWidth = 0;
  private trackWidth = 0;
  private ratio = 1;
  private viewportWidth: number;
  private animation: { from: number; to: number; start: number } | null = null;
  private frame = 0;
  private observer: ResizeObserver | undefined;
  private destroyed = false;

  constructor(host: HTMLElement, options: SwipePaginationOptions = {}) {
    this.options = { ...options };
    this.total = toTotal(options.total);
    this.active = clampPage(options.active, this.total);

    this.root = document.createElement('nav');
    this.prevButton = document.createElement('button');
    this.nextButton = document.createElement('button');
    this.viewport = document.createElement('div');
    this.track = document.createElement('div');
    this.prevButton.type = this.nextButton.type = 'button';
    this.viewport.append(this.track);
    this.root.append(this.prevButton, this.viewport, this.nextButton);
    this.applyChrome();
    host.append(this.root);

    this.root.addEventListener('click', this.handleClick);
    this.viewport.addEventListener('keydown', this.handleKeydown);
    this.viewport.addEventListener('scroll', this.render, { passive: true });
    for (const type of ['pointerdown', 'wheel', 'touchstart']) {
      this.viewport.addEventListener(type, this.stopAnimation, { passive: true });
    }

    this.viewportWidth = this.viewport.clientWidth;
    this.measure();
    this.scrollToPage(this.active, { animate: false });

    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver(this.handleResize);
      this.observer.observe(this.viewport);
    }
    document.fonts?.ready.then(() => {
      if (!this.destroyed) this.refresh();
    });
  }

  getActive(): number {
    return this.active;
  }

  getTotal(): number {
    return this.total;
  }

  /** Pages currently (even partially) inside the viewport, or `null` while hidden. */
  getVisibleRange(): VisibleRange | null {
    if (!this.layout) return null;
    const x = this.virtualScroll - this.sideMargin;
    return {
      start: this.layout.pageAt(x),
      end: this.layout.pageAt(x + Math.max(0, this.viewport.clientWidth - 1)),
    };
  }

  /** Change the current page without calling `onChange`. */
  setActive(page: number, { scroll = true, animate = true }: SetActiveOptions = {}): void {
    const next = clampPage(page, this.total);
    if (next === this.active) return;
    const prevEl = this.items.get(this.active);
    if (prevEl) this.setActiveState(prevEl, false);
    this.active = next;
    const nextEl = this.items.get(next);
    if (nextEl) this.setActiveState(nextEl, true);
    if (scroll) this.scrollToPage(next, { animate });
  }

  /** Change the current page like a user would: scrolls to it and calls `onChange`. */
  goTo(page: number, event?: Event): void {
    const before = this.active;
    this.setActive(page);
    if (this.active !== before) this.options.onChange?.(this.active, event);
  }

  /** Scroll one step back. Repeated calls accumulate while animating. */
  scrollPrev(): void {
    this.scrollByStep(-1);
  }

  /** Scroll one step forward. Repeated calls accumulate while animating. */
  scrollNext(): void {
    this.scrollByStep(1);
  }

  /** Center a page in the viewport without changing the current page. */
  scrollToPage(page: number, { animate = true }: ScrollOptions = {}): void {
    if (!this.layout) return;
    const target = clampPage(page, this.total);
    const center = this.sideMargin + this.layout.offsetOf(target) + this.layout.widthOf(target) / 2;
    this.scrollToVirtual(center - this.viewport.clientWidth / 2, animate);
  }

  scrollToActive(options?: ScrollOptions): void {
    this.scrollToPage(this.active, options);
  }

  /** Merge new options. Only the keys you pass are changed. */
  update(options: SwipePaginationOptions): void {
    const prev = this.options;
    this.options = { ...prev, ...options };
    this.applyChrome();

    const total = options.total === undefined ? this.total : toTotal(options.total);
    const totalChanged = total !== this.total;
    const hrefModeChanged = !!prev.href !== !!this.options.href;
    const relayout =
      totalChanged ||
      hrefModeChanged ||
      prev.sideMargin !== this.options.sideMargin ||
      !sameClassNames(prev.classNames, this.options.classNames);

    if (relayout) {
      const keep = totalChanged ? null : this.centerPage();
      this.total = total;
      this.active = clampPage(this.active, total);
      this.measure();
      this.scrollToPage(keep ?? this.active, { animate: false });
    } else {
      this.syncItems();
      this.render();
    }

    if (options.active !== undefined && options.active !== prev.active) {
      this.setActive(options.active);
    }
  }

  /** Re-measure item sizes, e.g. after a font or theme change. */
  refresh(): void {
    const keep = this.centerPage();
    this.measure();
    this.scrollToPage(keep ?? this.active, { animate: false });
  }

  destroy(): void {
    this.destroyed = true;
    this.stopAnimation();
    this.observer?.disconnect();
    this.items.clear();
    this.root.remove();
  }

  private get sideMargin() {
    return this.options.sideMargin ?? DEFAULTS.sideMargin;
  }

  private get virtualScroll() {
    return this.viewport.scrollLeft * this.ratio;
  }

  private className(key: keyof SwipePaginationClassNames) {
    return [BASE_CLASSES[key], this.options.classNames?.[key]].filter(Boolean).join(' ');
  }

  private label<K extends keyof SwipePaginationLabels>(key: K): SwipePaginationLabels[K] {
    return this.options.labels?.[key] ?? DEFAULT_LABELS[key];
  }

  private applyChrome() {
    this.root.className = this.className('root');
    this.root.setAttribute('aria-label', this.label('root'));
    this.viewport.className = this.className('viewport');
    this.track.className = this.className('track');
    const arrows = [
      [this.prevButton, 'prev', this.options.prevIcon ?? PREV_ICON],
      [this.nextButton, 'next', this.options.nextIcon ?? NEXT_ICON],
    ] as const;
    for (const [button, key, icon] of arrows) {
      button.className = `${this.className('arrow')} ${this.className(key)}`;
      button.setAttribute('aria-label', this.label(key));
      // Compare with what we set, not innerHTML: browsers re-serialize markup.
      if (this.icons[key] !== icon) button.innerHTML = this.icons[key] = icon;
    }
  }

  private makeItem(page: number) {
    const href = this.options.href;
    const el = document.createElement(href ? 'a' : 'button');
    if (el instanceof HTMLButtonElement) el.type = 'button';
    el.className = this.className('item');
    el.dataset.page = String(page);
    el.textContent = String(page);
    this.syncItem(el, page);
    this.setActiveState(el, page === this.active);
    return el;
  }

  private syncItem(el: HTMLElement, page: number) {
    if (el instanceof HTMLAnchorElement) el.href = this.options.href!(page);
    el.setAttribute('aria-label', this.label('page')(page));
  }

  private syncItems() {
    for (const [page, el] of this.items) this.syncItem(el, page);
  }

  private setActiveState(el: HTMLElement, on: boolean) {
    toggleClasses(el, this.className('active'), on);
    toggleClasses(el, this.className('inactive'), !on);
    if (on) el.setAttribute('aria-current', 'page');
    else el.removeAttribute('aria-current');
  }

  private clearItems() {
    for (const el of this.items.values()) el.remove();
    this.items.clear();
  }

  /** Measure one item per digit count and rebuild the layout. */
  private measure() {
    this.clearItems();
    const probe = this.makeItem(1);
    this.track.append(probe);
    const widths: number[] = [];
    let height = 0;
    for (let digits = 1; digits <= digitCount(this.total); digits++) {
      probe.textContent = '8'.repeat(digits);
      let width = 0;
      for (const active of [false, true]) {
        this.setActiveState(probe, active);
        const rect = probe.getBoundingClientRect();
        width = Math.max(width, rect.width);
        height = Math.max(height, rect.height);
      }
      widths.push(Math.ceil(width));
    }
    // A custom property reads back as written ("0.25rem", "calc(...)"); routing it through a real length resolves it to px.
    probe.style.marginLeft = 'var(--sp-gap, 0px)';
    const gap = parseFloat(getComputedStyle(probe).marginLeft) || 0;
    probe.remove();

    if (!(widths[0] > 0)) {
      this.layout = null;
      return;
    }
    this.layout = createLayout(this.total, widths, gap);
    this.contentWidth = this.layout.contentWidth + this.sideMargin * 2;
    this.trackWidth = Math.min(this.contentWidth, SwipePagination.maxTrackWidth);
    this.track.style.width = `${this.trackWidth}px`;
    this.track.style.height = `${Math.ceil(height)}px`;
    this.updateRatio();
  }

  private updateRatio() {
    const width = this.viewport.clientWidth;
    const maxReal = this.trackWidth - width;
    this.ratio = maxReal > 0 ? (this.contentWidth - width) / maxReal : 1;
  }

  private centerPage() {
    if (!this.layout) return null;
    return this.layout.pageAt(this.virtualScroll + this.viewportWidth / 2 - this.sideMargin);
  }

  private render = () => {
    const layout = this.layout;
    if (!layout) return;
    const width = this.viewport.clientWidth;
    const scrollLeft = this.viewport.scrollLeft;
    const virtual = scrollLeft * this.ratio;
    const margin = this.sideMargin;
    const overscan = this.options.overscan ?? DEFAULTS.overscan;
    const start = layout.pageAt(virtual - margin - overscan);
    const end = layout.pageAt(virtual + width - margin + overscan);

    for (const [page, el] of this.items) {
      if (page < start || page > end) {
        el.remove();
        this.items.delete(page);
      }
    }
    // Descending so each new item can be inserted before its right neighbour,
    // keeping DOM (and tab) order equal to visual order.
    for (let page = end; page >= start; page--) {
      let el = this.items.get(page);
      if (!el) {
        el = this.makeItem(page);
        el.style.width = `${layout.widthOf(page)}px`;
        this.track.insertBefore(el, this.items.get(page + 1) ?? null);
        this.items.set(page, el);
      }
      el.style.left = `${scrollLeft - virtual + margin + layout.offsetOf(page)}px`;
    }

    const atStart = scrollLeft <= 0;
    const atEnd = scrollLeft >= this.trackWidth - width - 1;
    this.prevButton.disabled = atStart;
    this.nextButton.disabled = atEnd;
    this.root.toggleAttribute('data-at-start', atStart);
    this.root.toggleAttribute('data-at-end', atEnd);
  };

  private scrollByStep(direction: 1 | -1) {
    const base = this.animation ? this.animation.to : this.virtualScroll;
    const step = this.viewport.clientWidth * (this.options.scrollStep ?? DEFAULTS.scrollStep);
    this.scrollToVirtual(base + direction * step, true);
  }

  private scrollToVirtual(target: number, animate: boolean) {
    this.stopAnimation();
    const max = Math.max(0, this.contentWidth - this.viewport.clientWidth);
    const to = Math.min(max, Math.max(0, target));
    const duration = this.options.duration ?? DEFAULTS.duration;
    if (!animate || duration <= 0) {
      this.setVirtualScroll(to);
      return;
    }
    this.animation = { from: this.virtualScroll, to, start: performance.now() };
    this.frame = requestAnimationFrame(this.tick);
  }

  private tick = () => {
    const { from, to, start } = this.animation!;
    const duration = this.options.duration ?? DEFAULTS.duration;
    const t = Math.min(1, (performance.now() - start) / duration);
    this.setVirtualScroll(from + (to - from) * easeOutCubic(t));
    if (t < 1) this.frame = requestAnimationFrame(this.tick);
    else this.animation = null;
  };

  private stopAnimation = () => {
    if (!this.animation) return;
    cancelAnimationFrame(this.frame);
    this.animation = null;
  };

  private setVirtualScroll(virtual: number) {
    this.viewport.scrollLeft = virtual / this.ratio;
    this.render();
  }

  /** Scroll the minimum amount needed to show a whole page. Only reachable from a rendered item. */
  private revealPage(page: number) {
    const layout = this.layout!;
    const width = this.viewport.clientWidth;
    const virtual = this.virtualScroll;
    const left = this.sideMargin + layout.offsetOf(page);
    const right = left + layout.widthOf(page);
    if (left < virtual) this.scrollToVirtual(left - this.sideMargin, false);
    else if (right > virtual + width) this.scrollToVirtual(right + this.sideMargin - width, false);
  }

  private pageOf(target: EventTarget | null) {
    const el = (target as Element).closest<HTMLElement>('[data-page]');
    return el && this.track.contains(el) ? Number(el.dataset.page) : null;
  }

  private handleClick = (event: MouseEvent) => {
    const target = event.target as Element;
    if (this.prevButton.contains(target)) return this.scrollPrev();
    if (this.nextButton.contains(target)) return this.scrollNext();
    const page = this.pageOf(target);
    if (page === null) return;
    // Modified clicks on links open a new tab; the current page stays.
    if (this.options.href && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
    this.goTo(page, event);
  };

  private handleKeydown = (event: KeyboardEvent) => {
    const page = this.pageOf(event.target);
    if (page === null) return;
    const target = { ArrowLeft: page - 1, ArrowRight: page + 1, Home: 1, End: this.total }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    const next = clampPage(target, this.total);
    this.revealPage(next);
    this.items.get(next)!.focus({ preventScroll: true });
  };

  private handleResize = () => {
    const width = this.viewport.clientWidth;
    if (width === this.viewportWidth) return;
    if (!this.layout) {
      this.viewportWidth = width;
      this.measure();
      this.scrollToPage(this.active, { animate: false });
      return;
    }
    const center = this.virtualScroll + this.viewportWidth / 2;
    this.viewportWidth = width;
    this.updateRatio();
    this.scrollToVirtual(center - width / 2, false);
  };
}
