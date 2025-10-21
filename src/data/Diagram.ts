import { unreachable } from "../util";
import type { Point } from "./Point";
import { Tile, transformTile } from "./Tile";
import { invSymm, Transform, transformPoint } from "./Transform";

export interface Diagram
{
	readonly tiles: Tile[][];
}

export function Diagram(width: number, height: number): Diagram
{
	return {
		tiles: Array.from(
			{ length: height },
			() => Array.from({ length: width }, () => Tile(" ")),
		),
	};
}

export function width(diagram: Diagram): number
{
	return diagram.tiles[0].length;
}

export function height(diagram: Diagram): number
{
	return diagram.tiles.length;
}

export function get(diagram: Diagram, { x, y }: Point): Tile | undefined
{
	if (y < 0 || y >= height(diagram) || x < 0 || x >= width(diagram))
		return undefined;
	return diagram.tiles[y][x];
}

export function set(diagram: Diagram, { x, y }: Point, tile: Tile)
{
	if (y < 0 || y >= height(diagram) || x < 0 || x >= width(diagram))
		throw new Error("index out of bounds");
	diagram.tiles[y][x] = tile;
}

export function getTrans(diagram: Diagram, point: Point, trans: Transform): Tile | undefined
{
	const tile = get(diagram, transformPoint(point, trans));
	if (tile === undefined)
		return undefined;
	return transformTile(tile, invSymm(trans.symm));
}

export function setTrans(diagram: Diagram, point: Point, trans: Transform, tile: Tile)
{
	set(diagram, transformPoint(point, trans), transformTile(tile, trans.symm));
}

export function removeColumn(diagram: Diagram, i: number)
{
	for (let y = 0; y < height(diagram); y++)
		diagram.tiles[y].splice(i, 1);
}

export function removeRow(diagram: Diagram, i: number)
{
	diagram.tiles.splice(i, 1);
}

export function addColumn(diagram: Diagram, i: number)
{
	const border = getBorder(diagram, i > 0 ? Transform(i - 1, 0, "|") : Transform(0, 0, "0"));
	for (let y = 0; y < height(diagram); y++)
		diagram.tiles[y].splice(i, 0, border[y] !== undefined ? Tile("-", border[y]!) : Tile(" "));
}

export function addRow(diagram: Diagram, i: number)
{
	const border = getBorder(diagram, i > 0 ? Transform(0, i - 1, "3") : Transform(0, 0, "\\"));
	diagram.tiles.splice(i, 0, border.map(c => c !== undefined ? Tile("|", c) : Tile(" ")));
}

function getBorder(diagram: Diagram, trans: Transform): (number | undefined)[]
{
	const result = [];
	let tile;
	for (let y = 0; (tile = getTrans(diagram, { x: 0, y }, trans)) !== undefined; y++)
	{
		switch (tile.type)
		{
			case " ":
			case "|":
			case "b":
			case "p":
				result.push(undefined);
				break;
			case "-":
			case "d":
			case "q":
			case "%":
				result.push(tile.colours[0]);
				break;
			case "$":
				result.push(tile.colours[1]);
				break;
			default:
				unreachable(tile.type);
		}
	}
	return result;
}
