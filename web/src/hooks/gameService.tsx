import { useEffect } from "react";
import type { Player } from "@/lib/types";
import useRoomStore from "@/store/roomStore";
import useSocketStore from "@/store/socketStore";

export const useGameService = () => {
	const { socket } = useSocketStore();
	const { setPlayers } = useRoomStore();

	useEffect(() => {
		if (!socket || socket.hasListeners("room-members")) return;

		socket.on("room-members", (data: Player[]) => setPlayers(data));

		return () => {
			socket.off("room-members");
		};
	}, [socket, setPlayers]);
};
