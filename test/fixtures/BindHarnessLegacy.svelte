<script>
	import SwipePagination from '../../src/svelte4/SwipePagination.svelte';

	export let page = 1;
	export let total = 100;
</script>

<SwipePagination {total} bind:active={page} />
<output>{page}</output>
