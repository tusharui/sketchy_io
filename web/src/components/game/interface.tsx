import { Copy } from "lucide-react";
import { toast } from "sonner";
import useRoomStore from "@/store/roomStore";
import { Button } from "../ui/button";
import { GameCanva } from "./canvas";
import { PlayerInput } from "./input";
import { PlayersInfo } from "./players";
import { GameSettings } from "./settings";

export function GameInterface() {
	const { roomId } = useRoomStore();
	const handleCopy = async () => {
		try {
			const link = `${window.location.href}?${roomId}`;
			await navigator.clipboard.writeText(link);
			toast.success("Room link copied to clipboard!");
		} catch (_) {
			toast.error("Failed to copy room link.");
		}
	};

	return (
		<main className="flex-1">
			<GameCanva />
			<PlayerInput />
			<PlayersInfo />
			<GameSettings />
			<Button onClick={handleCopy} className="flex items-center gap-2 p-1">
				<p>Invite</p>
				<Copy />
			</Button>
		</main>
	);
}
