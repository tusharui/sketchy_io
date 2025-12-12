import useRoomStore from "@/store/roomStore";

export function PlayersInfo() {
	const { players } = useRoomStore();
	return (
		<section className="flex flex-col gap-2">
			<header>Players :</header>
			<ul>
				{players.map(({ name, score }) => (
					<li className="flex gap-1" key={name + Date.now()}>
						<p>{name}</p>
						<p>{score}</p>
					</li>
				))}
			</ul>
		</section>
	);
}
