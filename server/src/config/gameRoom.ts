import {
	GameStatus,
	type GameType,
	type Player,
	type Setting,
} from "../lib/types";

class GameRoom {
	private type: GameType;
	private players: Map<string, Player>;
	private status: GameStatus;
	private settings: Setting;
	// private word: string | undefined;
	// private round: number;
	// private drawerId: string | undefined;

	constructor(type: GameType) {
		this.type = type;
		this.players = new Map();
		this.status = GameStatus.WAITING;
		this.settings = {
			totalPlayers: 8,
			maxRounds: 3,
			drawTime: 80,
			hints: 2,
		};
		// this.round = 0;
	}

	// add a player to the room
	addPlayer(player: Player) {
		this.players.set(player.id, player);
	}

	// get all players in the room
	getAllPlayers(): Player[] {
		return Array.from(this.players, ([_, player]) => {
			return player;
		});
	}

	// get total players count
	getPlayersCount(): number {
		return this.players.size;
	}

	// remove a player from the room
	removePlayer(playerId: string) {
		this.players.delete(playerId);
	}

	// update the game status
	updateStatus(status: GameStatus) {
		this.status = status;
	}

	// update the game settings
	updateSettings(settings: Setting) {
		this.settings = settings;
	}

	log() {
		console.log(this.settings, this.type, this.status);
	}
	// // check if word is correct
	// checkWord(word: string): boolean {
	//   if(this.status === gamesta)
	//   return false
	// }
}

export { GameRoom };
