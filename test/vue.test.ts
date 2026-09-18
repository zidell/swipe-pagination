import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { SwipePagination } from '../src/vue';
import DefaultExport from '../src/vue';

const mounted: { unmount(): void }[] = [];
afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount();
});

function mountPager(props: Record<string, unknown>, attrs: Record<string, unknown> = {}) {
  const wrapper = mount(SwipePagination, { props, attrs, attachTo: document.body });
  mounted.push(wrapper);
  return wrapper;
}

const item = (root: Element, page: number) =>
  root.querySelector<HTMLElement>(`.swipe-pagination__item[data-page="${page}"]`)!;

describe('Vue <SwipePagination>', () => {
  it('is also the default export', () => {
    expect(DefaultExport).toBe(SwipePagination);
  });

  it('renders into a host div and passes attrs through', () => {
    const wrapper = mountPager({ total: 100, active: 50 }, { class: 'pager' });
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('pager');
    expect(wrapper.find('nav.swipe-pagination').exists()).toBe(true);
    expect(item(wrapper.element, 50).getAttribute('aria-current')).toBe('page');
  });

  it('emits update:active and change on selection', () => {
    const wrapper = mountPager({ total: 100, active: 1 });
    item(wrapper.element, 4).click();
    expect(wrapper.emitted('update:active')).toEqual([[4]]);
    expect(wrapper.emitted('change')![0]).toEqual([4, expect.any(MouseEvent)]);
  });

  it('supports v-model:active', async () => {
    const page = ref(1);
    const Parent = defineComponent({
      setup: () => () =>
        h(SwipePagination, {
          total: 100,
          active: page.value,
          'onUpdate:active': (value: number) => (page.value = value),
        }),
    });
    const wrapper = mount(Parent, { attachTo: document.body });
    mounted.push(wrapper);
    item(wrapper.element, 7).click();
    await nextTick();
    expect(page.value).toBe(7);
    page.value = 9;
    await nextTick();
    expect(item(wrapper.element, 9).getAttribute('aria-current')).toBe('page');
  });

  it('forwards prop changes and exposes the instance', async () => {
    const wrapper = mountPager({ total: 100, active: 50 });
    await wrapper.setProps({ total: 5 });
    const pages = wrapper.findAll('.swipe-pagination__item').map((el) => Number(el.attributes('data-page')));
    expect(pages).toEqual([1, 2, 3, 4, 5]);
    const instance = (wrapper.vm as unknown as { getInstance(): { getTotal(): number } }).getInstance();
    expect(instance.getTotal()).toBe(5);
  });

  it('destroys the instance on unmount', () => {
    const wrapper = mount(SwipePagination, { props: { total: 10 }, attachTo: document.body });
    const host = wrapper.element as HTMLElement;
    wrapper.unmount();
    expect(host.querySelector('nav')).toBeNull();
  });
});
