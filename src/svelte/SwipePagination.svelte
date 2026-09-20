<!-- Svelte 5. On Svelte 4 or 3, import 'swipe-pagination/svelte4' or 'swipe-pagination/svelte3'. -->
<script>
	// A namespace import, so that on Svelte 4 or 3 — where `untrack` does not exist —
	// the bundler does not fail on a missing binding before index.js can say which
	// entry to use instead.
	import * as svelte from 'svelte';
	import { SwipePagination } from 'swipe-pagination';

	let {
		total = 1,
		active = $bindable(1),
		onChange,
		href,
		sideMargin,
		scrollStep,
		duration,
		overscan,
		classNames,
		labels,
		prevIcon,
		nextIcon,
		class: className = '',
		style,
	} = $props();

	let host;
	let instance = null;

	export function getInstance() {
		return instance;
	}

	const options = $derived({
		total,
		active,
		href,
		sideMargin,
		scrollStep,
		duration,
		overscan,
		classNames,
		labels,
		prevIcon,
		nextIcon,
	});

	$effect(() => {
		// Untracked: this effect mounts the pager once. Option changes go to the
		// effect below, which updates it in place instead of recreating it.
		const pager = new SwipePagination(host, {
			...svelte.untrack(() => options),
			onChange: (page, event) => {
				active = page;
				onChange?.(page, event);
			},
		});
		instance = pager;
		return () => {
			pager.destroy();
			instance = null;
		};
	});

	$effect(() => {
		const next = options;
		instance?.update(next);
	});
</script>

<div bind:this={host} class={className} {style}></div>
