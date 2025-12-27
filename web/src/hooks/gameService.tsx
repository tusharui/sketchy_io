import { useEffect } from "react";
import useGameStore from "@/store/gameStore";
import useSocketStore from "@/store/socketStore";

const useGameService = () => {
	const { socket } = useSocketStore();
	const { updateRound, choosingInfo, matchInfo } = useGameStore();
	useEffect(() => {
		if (!socket || socket.hasListeners("roundInfo")) return;

		socket.on("roundInfo", (round) => updateRound(round));
		socket.on("choosing", (data) => choosingInfo(data));
		socket.on("startMatch", (choice) => matchInfo(choice));

		return () => {
			socket.off("roundInfo");
			socket.off("choosing");
			socket.off("startMatch");
		};
	}, [socket, updateRound, choosingInfo, matchInfo]);
};

export default useGameService;
