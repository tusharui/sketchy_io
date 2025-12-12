import { create } from "zustand";
import { GameState, type Player } from "@/lib/types";

type Store = {
	gameState: GameState;
	setGameState: (state: GameState) => void;
	roomId: string | null;
	isHost: boolean;
	players: Player[];
	setPlayers: (players: Player[]) => void;
	setEnterGame: (
		gameState: GameState,
		roomId: string,
		isHost: boolean,
		players: Player[],
	) => void;
};

const useRoomStore = create<Store>()((set) => ({
	gameState: GameState.ONBOARDING,
	setGameState: (state) => set({ gameState: state }),
	roomId: null,
	isHost: false,
	players: [],
	setPlayers: (players) => set({ players: players }),
	setEnterGame: (gameState, roomId, isHost, players) =>
		set({ gameState, roomId, isHost, players }),
}));

export default useRoomStore;
