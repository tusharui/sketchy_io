import { useEffect } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { WsEvs } from "@/lib/types";
import useSocketStore from "@/store/socketStore";

/**
 * makes connection to the socket server.
 *  and makes connection value globally available.
 */
const ConnectSocket = () => {
	const url = import.meta.env.VITE_SERVER_URL as string | undefined;
	const { setSocket, setIsConnected, setOnlinePlayers } = useSocketStore();

	useEffect(() => {
		if (!url) {
			throw new Error("VITE_SERVER_URL is not defined");
		}

		const socket = io(url);

		socket.on("connect", () => {
			setSocket(socket);
			setIsConnected(true);
		});

		socket.on(WsEvs.ONLINE, (data: number) => setOnlinePlayers(data));

		socket.on(WsEvs.ERROR, (err) => toast.error(err));

		socket.on("disconnect", () => {
			setSocket(null);
			setIsConnected(false);
		});

		return () => {
			socket.off("connect");
			socket.off("online-players");
			socket.off("disconnect");
			socket.close();
			setIsConnected(false);
		};
	}, [setSocket, setIsConnected, setOnlinePlayers]);
};

export default ConnectSocket;
