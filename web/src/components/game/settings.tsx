import { Copy } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import useRoomStore from "@/store/roomStore";
import useSocketStore from "@/store/socketStore";
import { Button } from "../ui/button";

type Setting = {
	totalPlayers: number;
	maxRounds: number;
	drawtime: number;
	hints: number;
};

export function GameSettings() {
	const { wsEmit } = useSocketStore();
	const { roomId } = useRoomStore();

	const playersCount = useRef<string>("8");
	const roundsCount = useRef<string>("3");
	const drawTime = useRef<string>("80");
	const hintsCount = useRef<string>("2");

	const options = [
		{
			input: playersCount,
			lable: "Total Players",
			values: ["4", "6", "8", "10", "12"],
		},
		{
			input: roundsCount,
			lable: "Max Rounds",
			values: ["2", "3", "4", "5", "6"],
		},
		{
			input: drawTime,
			lable: "Draw Time (s)",
			values: ["60", "80", "100", "120", "150"],
		},
		{
			input: hintsCount,
			lable: "Hints",
			values: ["1", "2", "3", "4", "5"],
		},
	];

	const handleStart = () => {
		const settings: Setting = {
			totalPlayers: parseInt(playersCount.current, 10),
			maxRounds: parseInt(roundsCount.current, 10),
			drawtime: parseInt(drawTime.current, 10),
			hints: parseInt(hintsCount.current, 10),
		};

		wsEmit("start-game", settings);
	};

	const handleCopy = async () => {
		try {
			const link = `${window.location.origin}/?${roomId}`;
			await navigator.clipboard.writeText(link);
			toast.success("Room link copied to clipboard!");
		} catch (_) {
			toast.error("Failed to copy room link.");
		}
	};

	return (
		<section className="border p-2 w-[70%] max-w-150 mx-auto">
			<form className="flex flex-wrap">
				{options.map(({ input, lable, values }) => (
					<div
						key={lable}
						className="w-1/2 flex items-center justify-between p-2"
					>
						<span className="text-sm font-medium ">{lable} :</span>
						<Select
							defaultValue={input.current}
							onValueChange={(value) => {
								if (input.current) input.current = value;
							}}
						>
							<SelectTrigger className="w-1/2">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{values.map((val) => (
									<SelectItem value={val} key={val}>
										{val}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				))}
			</form>
			<span className="flex items-center gap-2">
				<Button variant={"secondary"} onClick={handleStart} className="w-[70%]">
					Start
				</Button>
				<Button
					onClick={handleCopy}
					className="flex-1 flex items-center gap-2 p-1"
				>
					<p>Invite</p>
					<Copy />
				</Button>
			</span>
		</section>
	);
}
