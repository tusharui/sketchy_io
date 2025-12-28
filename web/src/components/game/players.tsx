import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import useGameStore from "@/store/gameStore";
import { Card, CardContent, CardHeader } from "../ui/card";

export function PlayersInfo({ className }: ComponentProps<"section">) {
	const { players } = useGameStore();
	return (
		<Card className={cn("flex flex-col gap-2", className)}>
			<CardHeader>Players : {players.length}</CardHeader>
			<CardContent>
				<ul>
					{players.map(({ name, score }, i) => {
						const key = `${name}+${i}`;
						return (
							<li className="flex gap-1" key={key}>
								<p>{name}</p>
								<p>{score}</p>
							</li>
						);
					})}
				</ul>
			</CardContent>
		</Card>
	);
}
