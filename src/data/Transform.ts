import type { Point } from "./Point";

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

function composeSymm(a: Symmetry, b: Symmetry): Symmetry
{
	return elimSymm(rot, flip, a, b);

	function rot(s: Symmetry): Symmetry
	{
		switch (s)
		{
			case "0":
				return "1";
			case "1":
				return "2";
			case "2":
				return "3";
			case "3":
				return "0";
			case "|":
				return "/";
			case "/":
				return "-";
			case "-":
				return "\\";
			case "\\":
				return "|";
		}
	}

	function flip(s: Symmetry): Symmetry
	{
		switch (s)
		{
			case "0":
				return "|";
			case "1":
				return "\\";
			case "2":
				return "-";
			case "3":
				return "/";
			case "|":
				return "0";
			case "/":
				return "3";
			case "-":
				return "2";
			case "\\":
				return "1";
		}
	}
}

export type Transform = {
	origin: Point;
	symm: Symmetry;
};

export function Transform(x: number, y: number, symm: Symmetry): Transform
{
	return { origin: { x, y }, symm };
}

export function composeTrans(a: Transform, b: Transform): Transform
{
	const { x, y } = transformPoint(a.origin, b);
	return Transform(x, y, composeSymm(a.symm, b.symm));
}

export function transformPoint(point: Point, trans: Transform): Point
{
	const { x, y } = elimSymm(({ x, y }) => ({ x: -y, y: x }), ({ x, y }) => ({ x: -x, y }), point, trans.symm);
	return { x: x + trans.origin.x, y: y + trans.origin.y };
}
