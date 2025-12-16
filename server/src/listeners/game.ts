import type { Socket } from "socket.io";
import { GameRooms, HubUsers, io } from "../config/socket";
import { GameStatus, type Setting, WsEvs } from "../lib/types";
import { emitErr } from "./utils";

type ChatMsg = {
	name: string;
	msg: string;
	isValid: boolean;
};

export const gameListeners = (ws: Socket) => {
	// chat message from client
	ws.on(WsEvs.MSG_TO_SERVER, (msg: string) => {
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

		io.in(roomId).emit(WsEvs.MSG_TO_WEB, clientMsg);
	});

	ws.on(WsEvs.START_GAME, (data: Setting) => {
		const roomId = HubUsers.get(ws.id)?.roomId as string;
		const room = GameRooms.get(roomId);
		if (!room) {
			emitErr(ws, "You are not in a valid room.");
			return;
		}
		room.settings = data;
		room.status = GameStatus.IN_PROGRESS;
	});
};
