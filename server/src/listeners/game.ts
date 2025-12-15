import type { Socket } from "socket.io";
import { GameRooms, HubUsers, io } from "../config/socket";
import { GameStatus } from "../lib/types";
import { emitErr } from "./utils";

type ChatMsg = {
	name: string;
	msg: string;
	isValid: boolean;
};

export const gameListeners = (ws: Socket) => {
	// to quickly join any random room
	ws.on("chat-msg-server", (msg: string) => {
		const user = HubUsers.get(ws.id);
		if (!user) {
			emitErr(ws, "somthing went wrong.");
			return;
		}

		const { name, roomId } = user;
		const room = GameRooms.get(roomId);
		if (!room) {
			emitErr(ws, "You are not in a valid room.");
			return;
		}

		// check if the msg is the correct word
		let isValid = false;
		if (room.status === GameStatus.IN_PROGRESS) {
			if (msg.toLowerCase() === room.word.toLowerCase()) {
				isValid = true;
				// other logic if correct ( update score, reduce time, etc. )
			}
		}

		const clientMsg: ChatMsg = {
			name,
			msg,
			isValid,
		};

		io.in(roomId).emit("chat-msg-client", clientMsg);
	});
};
