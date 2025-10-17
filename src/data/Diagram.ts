import type { Point } from "./Point";
import type { Tile } from "./Tile";

export interface Diagram
{
	readonly tiles: Tile[][];
}

export function diagram(width: number, height: number): Diagram
{
	return {
		tiles: Array.from(
			{ length: height },
			() => Array.from({ length: width }, () => ({ type: " ", colours: [] })),
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
