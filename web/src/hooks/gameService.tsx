import { useEffect } from "react";
import { type Player, WsEvs } from "@/lib/types";
import useRoomStore from "@/store/roomStore";
import useSocketStore from "@/store/socketStore";

export const useGameService = () => {
	const { socket } = useSocketStore();
	const { setPlayers } = useRoomStore();

	useEffect(() => {
		if (!socket || socket.hasListeners(WsEvs.MEMBERS_UPDATE)) return;

		socket.on(WsEvs.MEMBERS_UPDATE, (data: Player[]) => setPlayers(data));

		return () => {
			socket.off("room-members");
		};
	}, [socket, setPlayers]);
};
