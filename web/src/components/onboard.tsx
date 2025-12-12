import { useRef } from "react";
import { toast } from "sonner";
import { useRoomService } from "@/hooks/roomService";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

enum GameEntryType {
	CREATE,
	JOIN,
}

export function PlayerOnboard() {
	const { joinRoom, createRoom } = useRoomService();

	const nameRef = useRef<HTMLInputElement>(null);

	const handleSubmit = (type: GameEntryType) => {
		const name = nameRef.current?.value;
		if (!name) {
			toast.error("Please enter your name");
			return;
		}

		localStorage.setItem("sketchy_name", name);

		if (type === GameEntryType.JOIN) {
			const roomId = window.location.search.replace("?", "");
			joinRoom(name, roomId);
		} else createRoom(name);
	};

	return (
		<section className="flex-1 flex justify-center items-center">
			<form className="flex flex-col gap-2 p-2">
				<Input
					ref={nameRef}
					defaultValue={localStorage.getItem("sketchy_name") || ""}
					type="text"
					placeholder="Enter your name"
					className="outline-none ring-0"
				/>
				<figure>Character</figure>
				<Button type="button" onClick={() => handleSubmit(GameEntryType.JOIN)}>
					Play!
				</Button>
				<Button
					type="button"
					variant={"secondary"}
					onClick={() => handleSubmit(GameEntryType.CREATE)}
				>
					Create Private Room
				</Button>
			</form>
		</section>
	);
}
