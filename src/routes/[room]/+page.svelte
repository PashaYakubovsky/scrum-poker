<script lang="ts">
	import { io } from '$lib/webSocketConnection.js';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let scrumSession = {
		users: [],
		currentStory: {
			name: '',
			storyPoints: 0,
			votes: [],
			hidden: true
		}
	};
	console.log(scrumSession);
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
		} catch (err) {
			console.log(err);
		}

		io.on('user', (user) => {
			userName = user.name;
			socketId = user.socketId;
			localStorage.setItem('user', JSON.stringify(user));
		});
		io.on('session', (session) => {
			scrumSession = session;
			console.log(scrumSession);
		});

		return () => {
			io.off('name');
			io.off('session');
		};
	});

	const handleReveal = () => {
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

<div class="w-screen bg-zinc-800 flex text-zinc-50 h-screen">
	<div class="w-[25%] h-screen">
		<!-- input area -->
		<div class="p-2 w-full">
			<label for="">Name</label>
			<input
				class="bg-gray-200 rounded-lg w-full px-2 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-black"
				type="text"
				on:blur={() => {
					io.emit('user', { name: userName });
				}}
				on:keypress={(e) => {
					if (e.key === 'Enter') {
						io.emit('user', { name: userName });
					}
				}}
				bind:value={userName}
			/>
		</div>
	</div>
	<!-- content area -->
	<div class="w-[75%] h-screen ml-auto flex gap-1">
		<div class="bg-zinc-700 w-full p-2 flex flex-col gap-4 h-full">
			<!-- Average box -->
			<div class="bg-blue-600 p-2 rounded-lg text-center">
				<h3>Average</h3>
				{#if scrumSession.currentStory?.hidden}
					<span class="text-black">Wait for reveal</span>
				{:else}
					<div>
						{(scrumSession.currentStory?.votes?.reduce((acc, vote) => acc + vote?.points, 0) ?? 1) /
							scrumSession.currentStory?.votes?.length || 0}
					</div>
				{/if}
			</div>

			<!-- User list -->
			<div class="">
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

			<!-- Votes -->
			<div>
				<span class="text-lg">Votes:</span>
				<div class="flex w-full gap-5 flex-wrap">
					{#each scrumSession.currentStory.votes as vote}
						<div class="bg-blue-500 h-fitt p-2 rounded-lg w-fit px-4 flex gap-4">
							<div>{vote.user.name}</div>
							<div class="rounded-lg bg-blue-700 px-2">
								{scrumSession.currentStory.hidden ? '-' : vote.points}
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- actions -->
			<div class="flex gap-4 ml-auto">
				<button on:click={handleReveal} class="bg-orange-400 p-2 rounded-lg w-fit">Reveal</button>
				<button on:click={handleNext} class="bg-orange-400 p-2 rounded-lg w-fit">Next</button>
			</div>

			<!-- input story points -->
			<div class="flex flex-col gap-4 content-center align-middle mt-auto">
				<div class="flex gap-10 items-center">
					<label for="storyPoints" class="w-[10rem] h-full">
						<div
							class="bg-zinc-600 p-2 py-3 rounded-lg w-[10rem] text-ellipsis text-center whitespace-nowrap overflow-hidden"
						>
							selected:
							{#if scrumSession.currentStory.votes.some((vote) => vote?.user?.socketId === socketId)}
								{scrumSession.currentStory.votes.find((vote) => vote?.user?.socketId === socketId)
									.points}
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
					<button on:click={handleVote} class="bg-orange-400 p-2 rounded-lg w-fit">Vote</button>
				</div>
			</div>
		</div>
	</div>
</div>
