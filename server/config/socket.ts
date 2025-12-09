import { Server } from "socket.io";

const io = new Server();

type Players = {
	name: string;
	score: number;
};

enum GameType {
	PUBLIC,
	PRIVATE,
}

type GameRoom = {
	members: Map<string, Players>;
	word: string;
	round: number;
	drawerId: string;
	maxRounds: number;
	type: GameType;
};

// global state of palyers and room
const gameRoom = new Map<string, GameRoom>();
const players = new Map<string, string>();
let onlinePlayers = 0;

io.on("connection", (socket) => {
	console.log("new connection :", socket.id);

	io.emit("online-players", onlinePlayers++);

	socket.on("disconnect", () => {
		console.log("disconnected :", socket.id);
		removePlayer(socket.id);
		io.emit("online-players", --onlinePlayers);
	});
});

/**
 * remove player from room
 * @param socketId
 */
const removePlayer = (socketId: string) => {
	const roomId = players.get(socketId);
	if (roomId) {
		const room = gameRoom.get(roomId);
		if (room) {
			room.members.delete(socketId);
			// if room is empty, delete it
			if (room.members.size === 0) {
				gameRoom.delete(roomId);
			}
		}
	}
};

export { io, gameRoom };
