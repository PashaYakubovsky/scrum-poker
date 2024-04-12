<script>
	import { spring } from 'svelte/motion';
	const mouseCoords = spring({ x: 0, y: 0, stiffness: 0.1, damping: 0.01 });
	const onMouseMove = (event) => {
		$mouseCoords = { x: event.x, y: event.y };
	};
</script>

<svelte:window on:mousemove={onMouseMove} />

<div class="container">
	<div class="cursor" style:--x={`${$mouseCoords.x}px`} style:--y={`${$mouseCoords.y}px`} />
</div>

<style>
	.container {
		position: fixed;
		top: 0;
		left: 0;
		z-index: 25;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	.cursor {
		position: absolute;
		top: 0;
		left: 0;

		width: 35px;
		height: 35px;
		border-radius: 50%;
		border: 2px solid #b2ddff;

		transform: translate(-50%, -50%) translate(var(--x, 0px), var(--y, 0px));
	}
</style>
