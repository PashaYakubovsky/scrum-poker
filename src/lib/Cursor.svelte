<script>
	import { spring } from 'svelte/motion';
	const mouseCoords = spring({ x: 0, y: 0 });
	const onMouseMove = (event) => {
		$mouseCoords = { x: event.x, y: event.y };
	};
</script>

<svelte:window on:mousemove={onMouseMove} />

<div class="container">
	<div class="cursor" style:--x={`${$mouseCoords.x}px`} style:--y={`${$mouseCoords.y}px`} />
</div>

<style>
	:global(body) {
		width: 100vw;
		height: 200vh;
	}

	:global(*),
	:global(body) {
		padding: 0;
		margin: 0;
	}

	.container {
		position: fixed;
		top: 0;
		left: 0;
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
		border: 2px solid #cc892b;

		transform: translate(-50%, -50%) translate(var(--x, 0px), var(--y, 0px));
	}
</style>
