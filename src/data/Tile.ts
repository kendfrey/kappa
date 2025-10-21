import { elimSymm, type Symmetry } from "./Transform";

export type TileType = " " | "-" | "|" | "b" | "d" | "p" | "q" | "%" | "$";

export interface Tile
{
	readonly type: TileType;
	readonly colours: readonly number[];
}

export function Tile(type: TileType, ...colours: readonly number[]): Tile
{
	return { type, colours };
}

export function transformTile(tile: Tile, symm: Symmetry): Tile
{
	return elimSymm(rot, flip, tile, symm);

	function rot(t: Tile): Tile
	{
		switch (t.type)
		{
			case " ":
				return t;
			case "|":
				return Tile("-", ...t.colours);
			case "-":
				return Tile("|", ...t.colours);
			case "b":
				return Tile("p", ...t.colours);
			case "d":
				return Tile("b", ...t.colours);
			case "p":
				return Tile("q", ...t.colours);
			case "q":
				return Tile("d", ...t.colours);
			case "%":
				return Tile("$", t.colours[0], t.colours[2], t.colours[1]);
			case "$":
				return Tile("%", ...t.colours);
		}
	}

	function flip(t: Tile): Tile
	{
		switch (t.type)
		{
			case " ":
			case "|":
			case "-":
			case "%":
				return t;
			case "b":
				return Tile("d", ...t.colours);
			case "d":
				return Tile("b", ...t.colours);
			case "p":
				return Tile("q", ...t.colours);
			case "q":
				return Tile("p", ...t.colours);
			case "$":
				return Tile("$", t.colours[0], t.colours[2], t.colours[1]);
		}
	}
}

export type Segment = "n" | "e" | "s" | "w" | "c";

export function transformSegment(segment: Segment, symm: Symmetry): Segment
{
	return elimSymm(rot, flip, segment, symm);

	function rot(s: Segment): Segment
	{
		switch (s)
		{
			case "n":
				return "e";
			case "e":
				return "s";
			case "s":
				return "w";
			case "w":
				return "n";
			case "c":
				return "c";
		}
	}

	function flip(s: Segment): Segment
	{
		switch (s)
		{
			case "n":
			case "s":
			case "c":
				return s;
			case "e":
				return "w";
			case "w":
				return "e";
		}
	}
}
