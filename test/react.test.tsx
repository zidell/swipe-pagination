import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef, StrictMode, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SwipePagination, type SwipePaginationInstance } from '../src/react';

afterEach(cleanup);

const item = (container: HTMLElement, page: number) =>
  container.querySelector<HTMLElement>(`.swipe-pagination__item[data-page="${page}"]`)!;
const pages = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLElement>('.swipe-pagination__item')].map((el) => Number(el.dataset.page));

describe('React <SwipePagination>', () => {
  it('renders into a host div with className and style', () => {
    const { container } = render(<SwipePagination total={100} active={50} className="pager" style={{ width: 300 }} />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.className).toBe('pager');
    expect(host.style.width).toBe('300px');
    expect(host.querySelector('nav.swipe-pagination')).not.toBeNull();
    expect(item(container, 50).getAttribute('aria-current')).toBe('page');
  });

  it('exposes the core instance through an object ref and clears it on unmount', () => {
    const ref = createRef<SwipePaginationInstance>();
    const { unmount } = render(<SwipePagination ref={ref} total={100} active={50} />);
    expect(ref.current?.getActive()).toBe(50);
    unmount();
    expect(ref.current).toBeNull();
  });

  it('supports callback refs', () => {
    const ref = vi.fn();
    const { unmount } = render(<SwipePagination ref={ref} total={10} />);
    expect(ref).toHaveBeenLastCalledWith(expect.objectContaining({ getActive: expect.any(Function) }));
    unmount();
    expect(ref).toHaveBeenLastCalledWith(null);
  });

  it('works as a controlled component with useState', () => {
    function App() {
      const [page, setPage] = useState(1);
      return (
        <>
          <SwipePagination total={100} active={page} onChange={setPage} />
          <output>{page}</output>
        </>
      );
    }
    const { container } = render(<App />);
    fireEvent.click(item(container, 5));
    expect(screen.getByRole('status').textContent).toBe('5');
    expect(item(container, 5).getAttribute('aria-current')).toBe('page');
  });

  it('always calls the latest onChange', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { container, rerender } = render(<SwipePagination total={100} active={1} onChange={first} />);
    rerender(<SwipePagination total={100} active={1} onChange={second} />);
    fireEvent.click(item(container, 3));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith(3, expect.any(Object));
  });

  it('works without onChange', () => {
    const { container } = render(<SwipePagination total={100} active={1} />);
    fireEvent.click(item(container, 3));
    expect(item(container, 3).getAttribute('aria-current')).toBe('page');
  });

  it('forwards prop changes to the instance', () => {
    const ref = createRef<SwipePaginationInstance>();
    const { container, rerender } = render(<SwipePagination ref={ref} total={100} active={50} />);
    rerender(<SwipePagination ref={ref} total={5} active={2} />);
    expect(pages(container)).toEqual([1, 2, 3, 4, 5]);
    expect(ref.current?.getActive()).toBe(2);

    act(() => ref.current!.scrollNext());
    rerender(<SwipePagination ref={ref} total={5} active={2} labels={{ root: 'Seiten' }} />);
    expect(container.querySelector('nav')!.getAttribute('aria-label')).toBe('Seiten');
  });

  it('mounts exactly one strip under StrictMode', () => {
    const { container } = render(
      <StrictMode>
        <SwipePagination total={100} />
      </StrictMode>,
    );
    expect(container.querySelectorAll('nav.swipe-pagination')).toHaveLength(1);
  });
});
