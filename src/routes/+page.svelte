<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		// redirect to a new session with random id
		const randomId = Math.floor(Math.random() * 100000);
		goto(String(randomId));
	});
</script>
