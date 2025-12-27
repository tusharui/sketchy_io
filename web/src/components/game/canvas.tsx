import type { ComponentProps } from "react";
import { CanvaState } from "@/lib/types";
import { cn } from "@/lib/utils";
import useGameStore from "@/store/gameStore";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { GameSettings } from "./settings";

export function GameCanva({ className }: ComponentProps<"div">) {
	const { canvaState } = useGameStore();
	return (
		<Card className={cn("min-h-75", className)}>
			{canvaState === CanvaState.SETTINGS ? (
				<GameSettings />
			) : canvaState === CanvaState.DRAW ? (
				<DrawingBoard />
			) : (
				<CanvaUtils />
			)}
		</Card>
	);
}

function DrawingBoard() {
	const { choice } = useGameStore();
	return (
		<CardContent>
			<header className="flex justify-center">{choice}</header>
		</CardContent>
	);
}

function CanvaUtils() {
	const { canvaState, isDrawer, words, round, drawerName } = useGameStore();
	return (
		<CardContent className="flex justify-center items-center flex-1">
			{canvaState === CanvaState.CHOOSE && (
				<h1>
					{isDrawer ? (
						<>
							<div>Your are choosing</div>
							<ul className="flex gap-2 my-2">
								{words.map((word) => (
									<Button key={word} variant={"outline"}>
										{word}
									</Button>
								))}
							</ul>
						</>
					) : (
						`${drawerName} is choosing`
					)}
				</h1>
			)}
			{canvaState === CanvaState.ROUND && <h1>Round {round}</h1>}
		</CardContent>
	);
}
