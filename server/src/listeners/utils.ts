import type { Socket } from "socket.io";

/**
 * to send custom error message back to the socket client
 *
 * @param msg - error message that needs to send
 * @param ws  - socket of the client
 */
export const emitErr = (ws: Socket, msg: string) => {
	ws.emit("ws-error", msg);
};
