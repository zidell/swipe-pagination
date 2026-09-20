import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as svelte3 from 'svelte3';
import { VERSION, compile } from 'svelte3/compiler';
import * as internal from 'svelte3/internal';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as core from '../src/index';

/**
 * Svelte 3 compatibility. The component source is shipped as-is and compiled by
 * the consumer, so the only way to know it still works on Svelte 3 is to compile
 * it with Svelte 3 here. svelte@3 is installed under the `svelte3` alias; its
 * compiler can emit CommonJS, so the result runs with a `require` of our own and
 * never touches the Svelte 5 that the rest of the suite uses.
 */
type Module = { exports: Record<string, any> };

// Not `new URL(path, import.meta.url)`: Vite rewrites that pattern into asset resolution.
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = (path: string) => readFileSync(join(root, path), 'utf8');

function run(path: string, components: Record<string, Module> = {}): Module {
  const { js, warnings } = compile(source(path), { name: 'Compiled', format: 'cjs' });
  expect(warnings).toEqual([]);

  const module: Module = { exports: {} };
  const require = (id: string) => {
    if (id === 'svelte') return svelte3;
    if (id === 'svelte/internal') return internal;
    if (id === 'swipe-pagination') return core;
    if (id.endsWith('.svelte')) return components[id.slice(id.lastIndexOf('/') + 1)].exports;
    throw new Error(`unexpected import in ${path}: ${id}`);
  };
  new Function('require', 'module', 'exports', js.code)(require, module, module.exports);
  return module;
}

const component = run('src/svelte4/SwipePagination.svelte');
const SwipePagination = component.exports.default;
const harness = run('test/fixtures/BindHarnessLegacy.svelte', { 'SwipePagination.svelte': component });

const item = (root: Element, page: number) =>
  root.querySelector<HTMLElement>(`.swipe-pagination__item[data-page="${page}"]`)!;

describe('Svelte 3 <SwipePagination>', () => {
  let instance: { $destroy(): void } | null = null;
  const mount = (Component: any, props: Record<string, unknown>) => {
    const target = document.body.appendChild(document.createElement('div'));
    instance = new Component({ target, props });
    return { target, component: instance as any };
  };

  afterEach(() => {
    instance?.$destroy();
    instance = null;
  });

  it('is compiled by Svelte 3', () => {
    expect(VERSION).toMatch(/^3\./);
  });

  it('renders into a host div with class and style', () => {
    const { target } = mount(SwipePagination, { total: 100, active: 50, class: 'pager', style: 'width: 300px' });
    const host = target.querySelector<HTMLElement>('.pager')!;
    expect(host.style.width).toBe('300px');
    expect(item(host, 50).getAttribute('aria-current')).toBe('page');
  });

  it('calls onChange and forwards prop changes', async () => {
    const onChange = vi.fn();
    const { target, component: mounted } = mount(SwipePagination, { total: 100, active: 1, onChange });
    item(target, 6).click();
    expect(onChange).toHaveBeenCalledWith(6, expect.any(MouseEvent));

    mounted.$set({ total: 5 });
    await svelte3.tick();
    expect(target.querySelectorAll('.swipe-pagination__item')).toHaveLength(5);
    expect(mounted.getInstance().getTotal()).toBe(5);
  });

  it('supports bind:active and destroys the instance on unmount', async () => {
    const { target, component: mounted } = mount(harness.exports.default, { page: 1 });
    item(target, 6).click();
    await svelte3.tick();
    expect(target.querySelector('output')!.textContent).toBe('6');

    mounted.$destroy();
    instance = null;
    expect(target.querySelector('nav')).toBeNull();
  });
});
