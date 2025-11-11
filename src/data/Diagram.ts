import { unreachable } from "../util";
import type { Point } from "./Point";
import { type Segment, Tile, transformTile } from "./Tile";
import { composeTrans, invSymm, type Symmetry, Transform, transformPoint } from "./Transform";

export type Diagram = {
	readonly tiles: Tile[][];
};

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

export function getSignature(diagram: Diagram): string
{
	const left = getBorder(diagram, Transform(0, 0, "0")).map(c => c ?? "").join(",");
	const right = getBorder(diagram, Transform(width(diagram) - 1, 0, "|")).map(c => c ?? "").join(",");
	const top = getBorder(diagram, Transform(0, 0, "\\")).map(c => c ?? "").join(",");
	const bottom = getBorder(diagram, Transform(0, height(diagram) - 1, "3")).map(c => c ?? "").join(",");
	return `${left};${right};${top};${bottom}`;
}

export function isContinuous(diagram: Diagram): boolean
{
	for (let y = 0; y < height(diagram) - 1; y++)
	{
		const top = getBorder(diagram, Transform(0, y, "3")).join(",");
		const bottom = getBorder(diagram, Transform(0, y + 1, "\\")).join(",");
		if (top !== bottom)
			return false;
	}
	for (let x = 0; x < width(diagram) - 1; x++)
	{
		const left = getBorder(diagram, Transform(x, 0, "|")).join(",");
		const right = getBorder(diagram, Transform(x + 1, 0, "0")).join(",");
		if (left !== right)
			return false;
	}
	return true;
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

export function paint(diagram: Diagram, x: number, y: number, segment: Segment, to: number)
{
	const [arc, _] = getArc(diagram, { x, y }, segment);
	for (const [point, seg] of arc)
	{
		const originalTile = get(diagram, point);
		if (originalTile === undefined)
			continue;
		const colours = [...originalTile.colours];
		colours[seg] = to;
		set(diagram, point, Tile(originalTile.type, ...colours));
	}
}

export function getArc(diagram: Diagram, { x, y }: Point, segment: Segment): [[Point, number][], boolean]
{
	const tile = get(diagram, { x, y });
	if (tile === undefined)
		return [[], false];

	const arc = new Map<string, [Point, number]>();
	let startDir: Symmetry;
	switch (tile.type)
	{
		case " ":
			return [[], false];
		case "-":
		case "d":
		case "q":
			startDir = "0";
			break;
		case "|":
			startDir = "1";
			break;
		case "b":
		case "p":
			startDir = "2";
			break;
		case "%":
			switch (segment)
			{
				case "n":
					startDir = "1";
					break;
				case "e":
				case "w":
				case "c":
					startDir = "0";
					break;
				case "s":
					startDir = "3";
					break;
			}
			break;
		case "$":
			switch (segment)
			{
				case "n":
				case "s":
				case "c":
					startDir = "1";
					break;
				case "e":
					startDir = "2";
					break;
				case "w":
					startDir = "0";
					break;
			}
			break;
	}
	const startTrans = Transform(x, y, startDir);
	let terminated = true;
	terminated = followArc(diagram, startTrans, arc) && terminated;
	terminated = followArc(diagram, composeTrans(Transform(-1, 0, "2"), startTrans), arc) && terminated;
	return [[...arc.values()], terminated];
}

function followArc(diagram: Diagram, trans: Transform, arc: Map<string, [Point, number]>): boolean
{
	const tile = getTrans(diagram, { x: 0, y: 0 }, trans);
	if (tile === undefined)
		return false;

	let colourIndex: number;
	let nextTrans: Transform | undefined;
	switch (tile.type)
	{
		case " ":
		case "|":
		case "b":
		case "p":
			return false;
		case "-":
		case "%":
			colourIndex = 0;
			nextTrans = composeTrans(Transform(1, 0, "0"), trans);
			break;
		case "d":
			colourIndex = 0;
			nextTrans = composeTrans(Transform(0, -1, "3"), trans);
			break;
		case "q":
			colourIndex = 0;
			nextTrans = composeTrans(Transform(0, 1, "1"), trans);
			break;
		case "$":
			colourIndex = transformTile(Tile(tile.type, 0, 1, 0), trans.symm).colours.indexOf(1);
			break;
	}

	const segment = [trans.origin, colourIndex] satisfies [Point, number];
	const segmentId = `${trans.origin.x},${trans.origin.y},${colourIndex}`;
	if (arc.has(segmentId))
		return true;

	arc.set(segmentId, segment);

	if (nextTrans === undefined)
		return true;

	return followArc(diagram, nextTrans, arc);
}
