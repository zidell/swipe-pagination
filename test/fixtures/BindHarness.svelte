<script>
	import SwipePagination from '../../src/svelte/SwipePagination.svelte';

	let { page = $bindable(1), total = 100 } = $props();
</script>

<SwipePagination {total} bind:active={page} />
<output>{page}</output>
