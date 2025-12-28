import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Card } from "../ui/card";

export function GameInfo({ className }: ComponentProps<"div">) {
	return <Card className={cn("", className)}>game information</Card>;
}
