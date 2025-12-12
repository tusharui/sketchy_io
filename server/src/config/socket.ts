import { Server } from "socket.io";
import type { GameRoom } from "../lib/types";
import { gameListeners } from "../listeners/game";
import { roomListeners } from "../listeners/room";
import { broadcastTotalMembers } from "../listeners/utils";

const io = new Server();

// global state of palyers and room
const GameRooms = new Map<string, GameRoom>();
const Clients = new Map<string, string>();
let onlinePlayers = 0;

io.on("connection", (socket) => {
	io.emit("online-players", onlinePlayers++);

	// register all the listeners
	roomListeners(socket);
	gameListeners(socket);

	socket.on("disconnect", () => {
		// remove player from room
		const socketId = socket.id;
		const roomId = Clients.get(socketId);
		if (roomId) {
			const room = GameRooms.get(roomId);
			if (room) {
				room.members.delete(socketId);
				socket.leave(roomId);
				broadcastTotalMembers(roomId);
				// if room is empty, delete it
				if (room.members.size === 0) GameRooms.delete(roomId);
			}
		}

		io.emit("online-players", --onlinePlayers - 1);
	});
});

export { io, GameRooms, Clients };
