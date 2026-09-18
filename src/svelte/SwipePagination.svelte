<script>
	import { onMount } from 'svelte';
	import { SwipePagination } from 'swipe-pagination';

	export let total = 1;
	export let active = 1;
	export let onChange = undefined;
	export let href = undefined;
	export let sideMargin = undefined;
	export let scrollStep = undefined;
	export let duration = undefined;
	export let overscan = undefined;
	export let classNames = undefined;
	export let labels = undefined;
	export let prevIcon = undefined;
	export let nextIcon = undefined;
	let className = '';
	export { className as class };
	export let style = undefined;

	let host;
	let instance = null;

	export function getInstance() {
		return instance;
	}

	$: options = {
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
	};
	$: instance?.update(options);

	onMount(() => {
		instance = new SwipePagination(host, {
			...options,
			onChange: (page, event) => {
				active = page;
				onChange?.(page, event);
			},
		});
		return () => {
			instance.destroy();
			instance = null;
		};
	});
</script>

<div bind:this={host} class={className} {style}></div>
