import { RootHeader } from "./components/header";
import ConnectSocket from "./hooks/socketConntect";

function App() {
	ConnectSocket();
	return (
		<main className="w-screen h-screen p-2 flex flex-col">
			<RootHeader />
		</main>
	);
}

export default App;
