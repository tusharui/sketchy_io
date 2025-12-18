import { create } from "zustand";
import type { TypedSocket, WsAuth } from "@/lib/types";

type ws = TypedSocket | null;
type Store = {
	socket: ws;
	setSocket: (socket: ws) => void;
	isConnected: boolean;
	setIsConnected: (status: boolean) => void;
	connect: (auth: WsAuth) => void;
	disconnect: () => void;
};

const useSocketStore = create<Store>()((set, get) => ({
	socket: null,
	setSocket: (socket) => set({ socket }),
	isConnected: false,
	setIsConnected: (status) => set({ isConnected: status }),
	connect: (auth) => {
		const { socket } = get();
		if (!socket) return;
		if (!socket.connected) {
			socket.auth = auth;
			socket.connect();
		}
	},
	disconnect: () => {
		const { socket } = get();
		if (!socket) return;
		if (socket.connected) socket.disconnect();
	},
}));

export default useSocketStore;
