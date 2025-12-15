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

export type GameRoom = {
	members: Members;
	word: string;
	round: number;
	drawerId: string;
	status: GameStatus;
	type: GameType;
};

export type User = {
	name: string;
	roomId: string;
};
