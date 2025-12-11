export type Player = {
	name: string;
	score: number;
};

export enum GameType {
	PUBLIC,
	PRIVATE,
}

export type GameRoom = {
	members: Map<string, Player>;
	word: string;
	round: number;
	drawerId: string;
	type: GameType;
};
