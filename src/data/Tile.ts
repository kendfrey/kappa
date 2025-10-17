import { elimSymm, type Symmetry } from "./Transform";

export type TileType = " " | "-" | "|" | "b" | "d" | "p" | "q" | "%" | "$";

export interface Tile
{
	readonly type: TileType;
	readonly colours: readonly number[];
}

export function tile(type: TileType, colours: readonly number[]): Tile
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
				return { type: "-", colours: t.colours };
			case "-":
				return { type: "|", colours: t.colours };
			case "b":
				return { type: "p", colours: t.colours };
			case "d":
				return { type: "b", colours: t.colours };
			case "p":
				return { type: "q", colours: t.colours };
			case "q":
				return { type: "d", colours: t.colours };
			case "%":
				return { type: "$", colours: [t.colours[0], t.colours[2], t.colours[1]] };
			case "$":
				return { type: "%", colours: t.colours };
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
				return { type: "d", colours: t.colours };
			case "d":
				return { type: "b", colours: t.colours };
			case "p":
				return { type: "q", colours: t.colours };
			case "q":
				return { type: "p", colours: t.colours };
			case "$":
				return { type: "$", colours: [t.colours[0], t.colours[2], t.colours[1]] };
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
