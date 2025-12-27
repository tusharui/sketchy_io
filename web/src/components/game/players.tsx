import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import useGameStore from "@/store/gameStore";

export function PlayersInfo({ className }: ComponentProps<"section">) {
	const { players } = useGameStore();
	return (
		<section className={cn("flex flex-col gap-2", className)}>
			<header>Players : {players.length}</header>
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
		</section>
	);
}
