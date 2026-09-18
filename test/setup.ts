import { afterEach, beforeEach } from 'vitest';
import { SwipePagination } from '../src/core/SwipePagination';

/**
 * jsdom has no layout engine. This fakes just enough of one, deterministically:
 * - item width = 12 + 8 * digits (+2 when active), height = 30
 * - viewport width = `metrics.viewportWidth`
 * - scrollLeft is stored and clamped like a browser does
 */
export const metrics = {
  viewportWidth: 200,
  hidden: false,
};

export const ITEM_HEIGHT = 30;
export const itemWidth = (digits: number, active = false) => 12 + 8 * digits + (active ? 2 : 0);

const scrollPositions = new WeakMap<Element, number>();
const is = (el: Element, cls: string) => el.classList.contains(cls);

Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
  configurable: true,
  get(this: HTMLElement) {
    if (is(this, 'swipe-pagination__viewport')) return metrics.hidden ? 0 : metrics.viewportWidth;
    return 0;
  },
});

Object.defineProperty(HTMLElement.prototype, 'scrollLeft', {
  configurable: true,
  get(this: HTMLElement) {
    return scrollPositions.get(this) ?? 0;
  },
  set(this: HTMLElement, value: number) {
    const content = parseFloat((this.firstElementChild as HTMLElement | null)?.style.width ?? '') || 0;
    const max = Math.max(0, content - this.clientWidth);
    scrollPositions.set(this, Math.min(max, Math.max(0, value)));
  },
});

HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
  const measurable = is(this, 'swipe-pagination__item') && !metrics.hidden;
  const width = measurable ? itemWidth(this.textContent!.length, this.hasAttribute('aria-current')) : 0;
  const height = measurable ? ITEM_HEIGHT : 0;
  return { x: 0, y: 0, top: 0, left: 0, right: width, bottom: height, width, height, toJSON() {} } as DOMRect;
};

export class MockResizeObserver {
  static instances = new Set<MockResizeObserver>();
  targets = new Set<Element>();
  constructor(readonly callback: ResizeObserverCallback) {}
  observe(target: Element) {
    this.targets.add(target);
    MockResizeObserver.instances.add(this);
  }
  unobserve(target: Element) {
    this.targets.delete(target);
  }
  disconnect() {
    this.targets.clear();
    MockResizeObserver.instances.delete(this);
  }
}

export function resize(width: number) {
  metrics.viewportWidth = width;
  for (const observer of MockResizeObserver.instances) {
    observer.callback([], observer as unknown as ResizeObserver);
  }
}

beforeEach(() => {
  metrics.viewportWidth = 200;
  metrics.hidden = false;
  globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  SwipePagination.maxTrackWidth = 10_000_000;
});

afterEach(() => {
  MockResizeObserver.instances.clear();
  document.body.innerHTML = '';
});
