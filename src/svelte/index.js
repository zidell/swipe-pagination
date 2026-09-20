import * as svelte from 'svelte';

// `mount` exists only in Svelte 5. Older compilers read this component's `$props()`
// as a store subscription and emit warnings instead of an error, so without this
// check a Svelte 4 or 3 app builds fine and then dies with "props is not defined".
if (typeof svelte.mount !== 'function') {
	throw new Error(
		"swipe-pagination/svelte needs Svelte 5. Import 'swipe-pagination/svelte4' on Svelte 4, or 'swipe-pagination/svelte3' on Svelte 3.",
	);
}

export { default, default as SwipePagination } from './SwipePagination.svelte';
