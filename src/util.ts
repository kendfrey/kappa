export function unreachable(_: never): never
{
	throw new Error("unreachable code");
}

export function randomId(): string
{
	const [a, b, c, d, e, f, g, h] = [...crypto.getRandomValues(new Uint16Array(8))]
		.map(x => x.toString(16).padStart(4, "0"));
	return `${a}${b}-${c}-${d}-${e}-${f}${g}${h}`;
}
