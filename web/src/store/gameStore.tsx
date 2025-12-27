import { create } from "zustand";
import {
	CanvaState,
	type choiceData,
	GameState,
	type Player,
} from "@/lib/types";

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
	canvaState: CanvaState;
	isDrawer: boolean;
	drawerName: string;
	words: Array<string>;
	round: number;
	updateRound: (round: number) => void;
	choosingInfo: (data: choiceData) => void;
	choice: string;
	choiceLen: number;
	matchInfo: (choice: string) => void;
};

const useGameStore = create<Store>()((set) => ({
	// to handle players in the room
	gameState: GameState.PLAYING,
	setGameState: (state) => set({ gameState: state }),
	roomId: null,
	isHost: false,
	players: [],
	setPlayers: (players) => set({ players: players }),
	setEnterGame: (gameState, roomId, isHost, players) =>
		set({ gameState, roomId, isHost, players }),

	// to handle the match
	canvaState: CanvaState.DRAW,
	isDrawer: false,
	drawerName: "",
	words: [],
	round: 0,
	choice: "",
	choiceLen: 0,
	updateRound: (round) => set({ round, canvaState: CanvaState.ROUND }),
	choosingInfo: (data) => {
		if (data.isDrawer) set({ words: data.choice, isDrawer: true });
		else set({ drawerName: data.name, isDrawer: false });
	},
	matchInfo: (choice) => set({ choice }),
}));

export default useGameStore;
