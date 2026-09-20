import { SvelteComponent } from 'svelte';
import type { SwipePagination as Core, SwipePaginationOptions } from 'swipe-pagination';

export type { SwipePaginationOptions } from 'swipe-pagination';
export type SwipePaginationInstance = Core;

export interface SwipePaginationProps extends SwipePaginationOptions {
  class?: string;
  style?: string;
}

declare class SwipePagination extends SvelteComponent<SwipePaginationProps> {
  getInstance(): Core | null;
}

export { SwipePagination };
export default SwipePagination;
