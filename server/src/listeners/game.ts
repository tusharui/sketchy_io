import type { Socket } from "socket.io";

export const gameListeners = (ws: Socket) => {
	// to quickly join any random room
	// ws.on("quick-join", (data) => {});
	console.log(ws.id);
};
