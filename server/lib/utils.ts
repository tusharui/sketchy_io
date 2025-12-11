export const generateId = (size: number) => {
	const random = "qwertyuiopasdfghjklzxcvbnm0987654321";
	let id = "";
	for (let i = 0; i < size; i++) {
		id += random[Math.floor(Math.random() * random.length - 1)];
	}
	return id;
};
