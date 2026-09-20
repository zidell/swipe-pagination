// Svelte 3 types. `SvelteComponent` only became generic in Svelte 4, and
// `SvelteComponentTyped` was removed in Svelte 5, so the two majors cannot
// share one declaration file. The runtime code is identical.
import { SvelteComponentTyped } from 'svelte';
import type { SwipePagination as Core, SwipePaginationOptions } from 'swipe-pagination';

export type { SwipePaginationOptions } from 'swipe-pagination';
export type SwipePaginationInstance = Core;

export interface SwipePaginationProps extends SwipePaginationOptions {
  class?: string;
  style?: string;
}

declare class SwipePagination extends SvelteComponentTyped<SwipePaginationProps> {
  getInstance(): Core | null;
}

export { SwipePagination };
export default SwipePagination;
