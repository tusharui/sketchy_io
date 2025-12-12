export enum GameType {
	PUBLIC,
	PRIVATE,
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
	type: GameType;
};
