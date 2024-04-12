// overlay store svelte
import { writable } from 'svelte/store';

export const overlayStore = writable({
	showOverlay: false,

	openOverlay: () => {
		overlayStore.update((store) => {
			store.showOverlay = true;
			return store;
		});
	},
	closeOverlay: () => {
		overlayStore.update((store) => {
			store.showOverlay = false;
			return store;
		});
	}
});
