import { create } from "zustand";
import { GameState, type Player } from "@/lib/types";

type Store = {
	gameState: GameState;
	setGameState: (state: GameState) => void;
	roomId: string | null;
	isHost: boolean;
	setEnterGame: (state: GameState, roomId: string, isHost: boolean) => void;
	players: Player[];
	setPlayers: (players: Player[]) => void;
};

const useRoomStore = create<Store>()((set) => ({
	gameState: GameState.ONBOARDING,
	setGameState: (state) => set({ gameState: state }),
	roomId: null,
	isHost: false,
	setEnterGame: (state, roomId, isHost) =>
		set({ gameState: state, roomId: roomId, isHost: isHost }),
	players: [],
	setPlayers: (players) => set({ players: players }),
}));

export default useRoomStore;
