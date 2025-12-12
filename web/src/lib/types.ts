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
