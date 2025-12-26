import type { DefaultEventsMap, Server, Socket } from "socket.io";

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

export enum GameType {
	PUBLIC,
	PRIVATE,
}

export enum GameStatus {
	WAITING,
	IN_PROGRESS,
	IN_MATCH,
	FINISHED,
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

// Define typed events for Socket.IO
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

type SocketData = {
	roomId: string;
	name: string;
};

export type TypedScoket = Socket<
	ClientSentEvents,
	ServerSentEvents,
	DefaultEventsMap,
	SocketData
>;

export type TypedIo = Server<ClientSentEvents, ServerSentEvents>;
