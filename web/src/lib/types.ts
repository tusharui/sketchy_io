export enum GameState {
	ONBOARDING,
	WAITING,
	PLAYING,
}

export type Player = {
	name: string;
	score: number;
	id: string;
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
