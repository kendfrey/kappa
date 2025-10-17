export const symmetries = ["0", "1", "2", "3", "|", "/", "-", "\\"] as const;

export type Symmetry = typeof symmetries[number];

export function invSymm(symm: Symmetry): Symmetry
{
	switch (symm)
	{
		case "0":
		case "2":
		case "|":
		case "/":
		case "-":
		case "\\":
			return symm;
		case "1":
			return "3";
		case "3":
			return "1";
	}
}

export function elimSymm<T>(rot: (x: T) => T, flip: (x: T) => T, x: T, symm: Symmetry): T
{
	switch (symm)
	{
		case "0":
			return x;
		case "1":
			return rot(x);
		case "2":
			return rot(rot(x));
		case "3":
			return rot(rot(rot(x)));
		case "|":
			return flip(x);
		case "/":
			return rot(flip(x));
		case "-":
			return rot(rot(flip(x)));
		case "\\":
			return rot(rot(rot(flip(x))));
	}
}
