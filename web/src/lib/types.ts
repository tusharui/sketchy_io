import type { Socket } from "socket.io-client";

export enum GameEntryType {
	CREATE,
	JOIN,
}
export type WsAuth =
	| {
			name: string;
			type: GameEntryType.CREATE;
	  }
	| {
			name: string;
			type: GameEntryType.JOIN;
			roomId: string;
	  };

export enum GameState {
	ONBOARDING,
	FINDING,
	WAITING,
	PLAYING,
}

export type Player = {
	name: string;
	score: number;
	id: string;
};

export type Setting = {
	totalPlayers: number;
	maxRounds: number;
	drawTime: number;
	hints: number;
};

export type ChatMsg = {
	name: string;
	msg: string;
	isValid: boolean;
};

type choiceData =
	| {
			isDrawer: true;
			choice: string[];
	  }
	| {
			isDrawer: false;
			name: string;
	  };

type startMatchData =
	| {
			isDrawer: true;
			choice: string;
	  }
	| {
			isDrawer: false;
			choiceLen: number;
	  };

type ClientSentEvents = {
	startGame: (settings: Setting) => void;
	chatMsg: (msg: string) => void;
	choiceMade: (choice: string) => void;
	endMatch: () => void;
};

type ServerSentEvents = {
	wsError: (error: string) => void;
	roomJoined: (roomId: string, players: Player[]) => void;
	roomCreated: (roomId: string, players: Player[]) => void;
	chatMsg: (msg: ChatMsg) => void;
	roomMembers: (players: Player[]) => void;
	roundInfo: (round: number) => void;
	choosing: (data: choiceData) => void;
	startMatch: (data: startMatchData) => void;
	reduceTime: (timeLeft: number) => void;
};

export type TypedSocket = Socket<ServerSentEvents, ClientSentEvents>;
