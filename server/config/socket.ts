import { Server } from "socket.io";
import type { GameRoom } from "../lib/types";
import { roomListeners } from "../listeners/room";

const io = new Server();

// global state of palyers and room
const gameRoom = new Map<string, GameRoom>();
const players = new Map<string, string>();
let onlinePlayers = 0;

io.on("connection", (socket) => {
	console.log("new connection :", socket.id);
	io.emit("online-players", onlinePlayers++);

	// register all the listeners
	roomListeners(socket);

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
	if (!roomId) return;
	const room = gameRoom.get(roomId);
	if (room) {
		room.members.delete(socketId);
		// if room is empty, delete it
		if (room.members.size === 0) gameRoom.delete(roomId);
	}
};

export { io, gameRoom };
