import { useGameService } from "@/hooks/gameService";
import { GameCanva } from "./canvas";
import { PlayerInput } from "./input";
import { PlayersInfo } from "./players";
import { GameSettings } from "./settings";

export function GameInterface() {
	useGameService();
	return (
		<main className="flex-1">
			<GameCanva />
			<PlayerInput />
			<PlayersInfo />
			<GameSettings />
		</main>
	);
}
