import { cleanup, render } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SwipePagination from '../src/svelte/SwipePagination.svelte';
import * as entry from '../src/svelte/index.js';
import BindHarness from './fixtures/BindHarness.svelte';

afterEach(cleanup);

const item = (root: Element, page: number) =>
  root.querySelector<HTMLElement>(`.swipe-pagination__item[data-page="${page}"]`)!;
const pages = (root: Element) =>
  [...root.querySelectorAll<HTMLElement>('.swipe-pagination__item')].map((el) => Number(el.dataset.page));

type Exports = { getInstance(): { getActive(): number; getTotal(): number } | null };

describe('Svelte <SwipePagination>', () => {
  it('is exported as default and named from the entry', () => {
    expect(entry.default).toBe(SwipePagination);
    expect(entry.SwipePagination).toBe(SwipePagination);
  });

  it('renders into a host div with class and style', () => {
    const { container } = render(SwipePagination, { total: 100, active: 50, class: 'pager', style: 'width: 300px' });
    const host = container.querySelector<HTMLElement>('.pager')!;
    expect(host.style.width).toBe('300px');
    expect(host.querySelector('nav.swipe-pagination')).not.toBeNull();
    expect(item(host, 50).getAttribute('aria-current')).toBe('page');
  });

  it('calls onChange', () => {
    const onChange = vi.fn();
    const { container } = render(SwipePagination, { total: 100, active: 1, onChange });
    item(container, 6).click();
    flushSync();
    expect(onChange).toHaveBeenCalledWith(6, expect.any(MouseEvent));
  });

  it('supports bind:active in both directions', async () => {
    const { container, rerender } = render(BindHarness, { page: 1 });
    item(container, 6).click();
    flushSync();
    expect(container.querySelector('output')!.textContent).toBe('6');

    // rerender replaces the harness's whole props object, so pass the state a real parent would hold.
    await rerender({ page: 6, total: 120 });
    expect(item(container, 6).getAttribute('aria-current')).toBe('page');

    await rerender({ page: 9 });
    expect(item(container, 9).getAttribute('aria-current')).toBe('page');
  });

  it('works without onChange', () => {
    const { container } = render(SwipePagination, { total: 100, active: 1 });
    item(container, 2).click();
    flushSync();
    expect(item(container, 2).getAttribute('aria-current')).toBe('page');
  });

  it('forwards prop changes and exposes the instance', async () => {
    const { container, component, rerender } = render(SwipePagination, { total: 100, active: 50 });
    await rerender({ total: 5 });
    expect(pages(container)).toEqual([1, 2, 3, 4, 5]);
    expect((component as unknown as Exports).getInstance()!.getTotal()).toBe(5);
  });

  it('destroys the instance on unmount', () => {
    const { container, component, unmount } = render(SwipePagination, { total: 10 });
    unmount();
    expect(container.querySelector('nav')).toBeNull();
    expect((component as unknown as Exports).getInstance()).toBeNull();
  });
});
