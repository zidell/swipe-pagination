import { defineComponent, h, onBeforeUnmount, onMounted, ref, watch, type PropType } from 'vue';
import {
  SwipePagination as Core,
  type SwipePaginationClassNames,
  type SwipePaginationLabels,
  type SwipePaginationOptions,
} from 'swipe-pagination';

export type { SwipePaginationOptions } from 'swipe-pagination';
export type SwipePaginationInstance = Core;

export const SwipePagination = defineComponent({
  name: 'SwipePagination',
  props: {
    total: Number,
    active: Number,
    href: Function as PropType<(page: number) => string>,
    sideMargin: Number,
    scrollStep: Number,
    duration: Number,
    overscan: Number,
    classNames: Object as PropType<Partial<SwipePaginationClassNames>>,
    labels: Object as PropType<Partial<SwipePaginationLabels>>,
    prevIcon: String,
    nextIcon: String,
  },
  emits: {
    'update:active': (page: number) => typeof page === 'number',
    change: (page: number, _event?: Event) => typeof page === 'number',
  },
  setup(props, { emit, expose }) {
    const host = ref<HTMLElement>();
    let instance: Core | null = null;
    const options = (): SwipePaginationOptions => ({ ...props });

    onMounted(() => {
      instance = new Core(host.value!, {
        ...options(),
        onChange: (page, event) => {
          emit('update:active', page);
          emit('change', page, event);
        },
      });
    });
    watch(options, (next) => instance!.update(next));
    onBeforeUnmount(() => {
      instance!.destroy();
      instance = null;
    });
    expose({ getInstance: () => instance });

    return () => h('div', { ref: host });
  },
});

export default SwipePagination;
