import { useEffect } from "react";
import useGameStore from "@/store/gameStore";
import useSocketStore from "@/store/socketStore";

const useGameService = () => {
	const { socket } = useSocketStore();
	const {
		updateRound,
		setChoosingInfo,
		setStartMatch,
		setEndMatch,
		setEndGame,
		setRestart,
	} = useGameStore();

	useEffect(() => {
		if (!socket || socket.hasListeners("roundInfo")) return;

		socket.on("roundInfo", (round) => updateRound(round));
		socket.on("choosing", (data) => setChoosingInfo(data));
		socket.on("startMatch", (matchInfo, time) =>
			setStartMatch(matchInfo, time),
		);
		socket.on("endMatch", (scoreBoard) => setEndMatch(scoreBoard));
		socket.on("results", (players) => setEndGame(players));
		socket.on("restart", () => setRestart());

		return () => {
			socket.off("roundInfo");
			socket.off("choosing");
			socket.off("startMatch");
			socket.off("endMatch");
			socket.off("results");
			socket.off("restart");
		};
	}, [
		socket,
		updateRound,
		setChoosingInfo,
		setStartMatch,
		setEndMatch,
		setEndGame,
		setRestart,
	]);
};

export default useGameService;
