import injectSocketIO from './src/lib/injectSocketIO';

export const webSocketServer = {
	name: 'webSocketServer',
	configureServer(server) {
		injectSocketIO(server.httpServer);
	}
};
