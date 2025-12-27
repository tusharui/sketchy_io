import useGameService from "@/hooks/gameService";
import { GameState } from "@/lib/types";
import useGameStore from "@/store/gameStore";
import { Spinner } from "../ui/spinner";
import { GameCanva } from "./canvas";
import { PlayerInput } from "./input";
import { PlayersInfo } from "./players";

export function GameInterface() {
	useGameService();
	const { gameState } = useGameStore();

	return (
		<main className="flex-1">
			{gameState === GameState.FINDING ? (
				<div className="size-full flex justify-center items-center">
					<Spinner className="size-[30%] max-w-25 " />
				</div>
			) : (
				<>
					<PlayerInput className="" />
					<PlayersInfo className="" />
					<GameCanva className="" />
				</>
			)}
		</main>
	);
}
