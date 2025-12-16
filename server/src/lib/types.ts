export enum GameType {
	PUBLIC,
	PRIVATE,
}

export enum GameStatus {
	WAITING,
	IN_PROGRESS,
	FINISHED,
}

export type Player = {
	name: string;
	score: number;
};

export type Members = Map<string, Player>;

export type Setting = {
	totalPlayers: number;
	maxRounds: number;
	drawtime: number;
	hints: number;
};

export type GameRoom = {
	type: GameType;

	members: Members;
	status: GameStatus;

	settings: Setting;

	word: string;
	round: number;
	drawerId: string;
};

export type User = {
	name: string;
	roomId: string;
};

export enum WsEvs {
	// game utils
	ONLINE = "online-players",
	ERROR = "ws-error",
	MEMBERS_UPDATE = "room-members",

	// room operations
	CREATE_ROOM = "create-room",
	ROOM_CREATED = "room-created",
	JOIN_ROOM = "join-room",
	ROOM_JOINED = "room-joined",

	// game life cycle
	START_GAME = "start-game",

	// chat operations
	MSG_TO_SERVER = "msg-to-server",
	MSG_TO_WEB = "msg-to-web",
}
