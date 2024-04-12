// socketIoHandler.js
import { Server } from 'socket.io';

export default function injectSocketIO(server) {
	const io = new Server(server);
	let users = {};
	let connections = {};
	let roomId = '';

	io.on('connection', (socket) => {
		let activeSession = {};
		// get room id from url
		const url = socket.handshake.headers.referer;
		if (url) {
			roomId = url.split('/').pop() ?? '';
			console.log('roomId', roomId);

			if (roomId) {
				const _cachedSession = connections[roomId];
				if (_cachedSession) {
					activeSession = _cachedSession;
				} else {
					activeSession = createScrumSession();
					connections[roomId] = activeSession;
				}

				socket.join(roomId);
				activeSession.id = roomId;
			} else {
				return new Error('Room ID not found');
			}
		}
		io.to(roomId).emit('session', activeSession);

		const newUser = {
			name: '',
			socketId: socket.id
		};
		users[socket.id] = newUser;

		// socket.onAny((event, ...args) => {
		// 	// update users in active session
		// 	// get all users from socket connections
		const activeConnections = io.sockets.adapter.rooms.get(activeSession.id) ?? new Set();
		const activeConnectionsArray = Array.from(activeConnections);
		console.log('activeConnections', activeConnections);
		if (Array.isArray(activeConnectionsArray)) {
			const roomUsers = [];

			activeConnections.forEach((socketId) => {
				roomUsers.push(users[socketId]);
			});

			console.log('roomUsers', roomUsers);
			activeSession.users = roomUsers ?? [];
			io.to(roomId).emit('session', activeSession);
		}
		// });

		socket.on('user', (values) => {
			try {
				if (users[socket.id]) {
					const keys = Object.keys(values);
					for (let i = 0; i < keys.length; i++) {
						const key = keys[i];
						users[socket.id][key] = values[key];
					}

					io.to(roomId).emit('user', users[socket.id]);
				}
			} catch (err) {
				console.log(err);
			}

			io.emit('session', activeSession);
		});

		socket.on('message', (message) => {
			io.to(roomId).emit('message', {
				from: socket.id,
				message: message,
				time: new Date().toLocaleString()
			});
		});

		socket.on('reveal', (data) => {
			activeSession.currentStory.hidden = false;
			io.to(roomId).emit('session', activeSession);
		});

		socket.on('next', (data) => {
			activeSession.currentStory = {
				name: '',
				storyPoints: 0,
				votes: [],
				hidden: true
			};

			io.to(roomId).emit('session', activeSession);
		});

		socket.on('vote', (data) => {
			data.user.socketId = socket.id;
			// check if user has already voted
			const userIndex = activeSession?.currentStory?.votes?.findIndex(
				(vote) => vote.user?.socketId === data?.user?.socketId
			);

			if (userIndex > -1) {
				activeSession.currentStory.votes[userIndex].points = data.points;
			} else {
				activeSession.currentStory.votes.push({
					user: data.user,
					points: data.points
				});
			}

			io.to(roomId).emit('session', activeSession);
		});
	});

	console.log('SocketIO injected');
}

const createScrumSession = () => {
	const scrumSession = {
		id: Math.round(Math.random() * 999999),
		name: '',
		users: [],
		currentStory: {
			name: '',
			storyPoints: 0,
			votes: [],
			hidden: true
		},
		expiredAt: new Date().getTime() + 1000 * 60 * 60
	};

	return scrumSession;
};
