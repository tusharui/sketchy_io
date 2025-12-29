import { useEffect } from "react";
import useGameStore from "@/store/gameStore";
import useSocketStore from "@/store/socketStore";

const useGameService = () => {
	const { socket } = useSocketStore();
	const { updateRound, setChoosingInfo, setMatchInfo, setEndMatch } =
		useGameStore();

	useEffect(() => {
		if (!socket || socket.hasListeners("roundInfo")) return;

		socket.on("roundInfo", (round) => updateRound(round));
		socket.on("choosing", (data) => setChoosingInfo(data));
		socket.on("startMatch", (matchInfo, time) => setMatchInfo(matchInfo, time));
		socket.on("endMatch", () => setEndMatch());

		return () => {
			socket.off("roundInfo");
			socket.off("choosing");
			socket.off("startMatch");
			socket.off("endMatch");
		};
	}, [socket, updateRound, setChoosingInfo, setMatchInfo, setEndMatch]);
};

export default useGameService;
