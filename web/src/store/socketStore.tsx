import { create } from "zustand";
import type { TypedSocket, WsAuth } from "@/lib/types";

type Store = {
	socket: TypedSocket | null;
	setSocket: (socket: TypedSocket | null) => void;
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
