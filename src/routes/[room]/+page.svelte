<script lang="ts">
	import { io } from '$lib/webSocketConnection.js';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Overlay from '$lib/Overlay.svelte';
	import { overlayStore } from '$lib/ovrlayStore';

	let scrumSession = {
		users: [],
		currentStory: {
			name: '',
			storyPoints: 0,
			votes: [],
			hidden: true
		}
	};
	let userName = '';
	let socketId = '';

	onMount(() => {
		io.emit('join', $page.params.room);
		// take name from local storage
		try {
			const user = localStorage.getItem('user');
			const userJson = JSON.parse(user ?? '');
			if (userJson) {
				io.emit('user', userJson);
			}

			userName = userJson.name;
			socketId = userJson.socketId;
		} catch (err) {
			console.log(err);
		}

		io.on('user', (data) => {
			if (io.id === data.socketId) {
				userName = data.user.name;
				localStorage.setItem('user', JSON.stringify(data.user));
			}
		});
		io.on('session', (session) => {
			scrumSession = session;
			console.log(scrumSession);
		});

		const handleKeyPress = (e) => {
			if (e.key === 'Escape') {
				$overlayStore.openOverlay();

				io.emit('clear');

				setTimeout(() => {
					$overlayStore.closeOverlay();
				}, 3000);
			}
		};

		document.addEventListener('keydown', handleKeyPress);

		return () => {
			io.off('name');
			io.off('session');

			document.removeEventListener('keydown', handleKeyPress);
		};
	});

	const handleReveal = () => {
		$overlayStore.openOverlay();
		setTimeout(() => {
			$overlayStore.closeOverlay();
		}, 3000);

		io.emit('reveal', {
			story: scrumSession.currentStory
		});
	};

	const handleNext = () => {
		const randomId = Math.floor(Math.random() * 100000);

		io.emit('next', {
			story: scrumSession.currentStory
		});

		// redirect to a new session with random id
		window.location.href = `/${randomId}`;
	};

	const handleVote = () => {
		io.emit('vote', {
			story: scrumSession.currentStory,
			points: scrumSession.currentStory.storyPoints,
			user: {
				name: userName,
				socketId
			}
		});
	};
</script>

<title>Poker room {scrumSession.id ?? 'loading...'}</title>

{#if $overlayStore.showOverlay}
	<Overlay />
{/if}

<div class="w-screen bg-[#101828] flex text-[#F9FAFB] h-screen max-md:flex-col">
	<div
		class={`w-[25%] max-md:w-full h-full ${userName === '' ? 'fixed w-full bg-[#101828] align-middle z-10' : ''}`}
	>
		{#if userName === ''}
			<div class="p-2">
				<h1 class="text-4xl">Welcome to Poker</h1>
				<p class="text-lg">Please enter your name to join the session</p>
				<h3 class="text-sm">Your room: {$page.params.room}</h3>
			</div>
		{/if}

		<!-- input area -->
		<div class="p-2 w-full">
			<label for="">Name</label>
			<input
				class="bg-gray-200 rounded-lg w-full px-2 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-black"
				type="text"
				on:input={(e) => {
					io.emit('user', { name: e.target.value });
				}}
				on:keypress={(e) => {
					if (e.key === 'Enter') {
						io.emit('user', { name: userName });
					}
				}}
				bind:value={userName}
			/>
		</div>

		<!-- User list -->
		<div class="p-2">
			<span class="text-lg">Users:</span>
			<div class="flex gap-2 flex-wrap">
				{#each scrumSession.users as user}
					<div class="bg-blue-500 p-2 rounded-lg w-fit px-4 flex gap-2 self-center items-center">
						{user.name}
						<!-- indicator -->
						<div class="bg-green-400 rounded-full w-2 h-2 ml-2"></div>
					</div>
				{/each}
			</div>
		</div>
	</div>
	<!-- content area -->
	<div class="w-[75%] h-full max-md:w-full ml-auto flex gap-1 relative">
		<div class="bg-[#475467] w-full p-2 flex flex-col gap-4 h-full">
			<!-- Average box -->
			<div class="p-2 rounded-lg text-center text-4xl">
				<h3>Average</h3>
				{#if scrumSession.currentStory?.hidden}
					<span class="text-black">Wait for reveal</span>
				{:else}
					<b>
						{(scrumSession.currentStory?.votes?.reduce((acc, vote) => acc + vote?.points, 0) ?? 1) /
							scrumSession.currentStory?.votes?.length || 0}
					</b>
				{/if}
			</div>

			<!-- Votes -->
			<div class="h-full">
				<span class="text-lg">Votes:</span>
				<div class="flex w-full gap-5 flex-wrap">
					{#each scrumSession.currentStory.votes as vote}
						<div class="bg-[#53B1FD] h-fitt p-2 rounded-lg w-fit px-4 flex gap-4">
							<div>{vote.user.name}</div>
							<div class="rounded-lg bg-[#D1E9FF] text-[#1D2939] px-2">
								{scrumSession.currentStory.hidden ? '-' : vote.points}
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- actions -->
			<div class="flex gap-4 ml-auto">
				<button
					on:click={handleReveal}
					disabled={scrumSession.currentStory?.votes?.length !== scrumSession.users?.length}
					class="bg-[#53B1FD] p-2 rounded-lg w-fit disabled:opacity-50 disabled:cursor-not-allowed"
					>Reveal</button
				>
				<button on:click={handleNext} class="bg-[#53B1FD] p-2 rounded-lg w-fit">Next</button>
			</div>

			<!-- input story points -->
			<div class="flex flex-col gap-4 content-center align-middle mt-auto sticky left-0 bottom-0">
				<div class="flex gap-10 items-center">
					<label for="storyPoints" class="w-[10rem] h-full">
						<div
							class="bg-[#53B1FD] p-2 py-3 rounded-lg w-[10rem] text-ellipsis text-center whitespace-nowrap overflow-hidden"
						>
							Selected:
							{#if scrumSession.currentStory.votes.some((vote) => vote?.user?.socketId === socketId)}
								{scrumSession.currentStory.votes.find((vote) => vote?.user?.socketId === socketId)
									?.points}
							{:else}
								0
							{/if}
						</div>
					</label>
					<input
						id="storyPoints"
						class="w-full bg-gray-200 rounded-lg px-2 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-black"
						type="number"
						on:keypress={(e) => {
							if (e.key === 'Enter') {
								handleVote();
							}
						}}
						on:focus={() => {
							scrumSession.currentStory.storyPoints = null;
						}}
						bind:value={scrumSession.currentStory.storyPoints}
					/>
					<button on:click={handleVote} class="bg-[#53B1FD] p-2 rounded-lg w-fit">Vote</button>
				</div>
			</div>
		</div>
	</div>
</div>
