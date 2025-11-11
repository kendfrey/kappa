import { unreachable } from "../util";
import { addColumn, addRow, type Diagram, get, getArc, height, paint, removeColumn, removeRow, width } from "./Diagram";
import type { Segment } from "./Tile";

type PaintStep = {
	type: "paint";
	x: number;
	y: number;
	segment: Segment;
	from: number;
	to: number;
};

type AddColumnStep = {
	type: "add-column";
	index: number;
};

type RemoveColumnStep = {
	type: "remove-column";
	index: number;
};

type AddRowStep = {
	type: "add-row";
	index: number;
};

type RemoveRowStep = {
	type: "remove-row";
	index: number;
};

export type ProofStep = PaintStep | AddColumnStep | RemoveColumnStep | AddRowStep | RemoveRowStep;

export function isValid(diagram: Diagram, step: ProofStep): boolean
{
	switch (step.type)
	{
		case "paint":
		{
			const [arc, terminated] = getArc(diagram, step, step.segment);
			return terminated && arc.every(([point, seg]) => get(diagram, point)?.colours[seg] === step.from);
		}
		case "add-column":
			return step.index >= 0 && step.index <= width(diagram);
		case "remove-column":
			for (let i = 0; i < height(diagram); i++)
			{
				const tile = get(diagram, { x: step.index, y: i });
				if (tile === undefined || (tile.type !== " " && tile.type !== "-"))
					return false;
			}
			return true;
		case "add-row":
			return step.index >= 0 && step.index <= height(diagram);
		case "remove-row":
			for (let i = 0; i < width(diagram); i++)
			{
				const tile = get(diagram, { x: i, y: step.index });
				if (tile === undefined || (tile.type !== " " && tile.type !== "|"))
					return false;
			}
			return true;
		default:
			unreachable(step);
	}
}

export function applyStep(diagram: Diagram, step: ProofStep)
{
	switch (step.type)
	{
		case "paint":
			paint(diagram, step.x, step.y, step.segment, step.to);
			break;
		case "add-column":
			addColumn(diagram, step.index);
			break;
		case "remove-column":
			removeColumn(diagram, step.index);
			break;
		case "add-row":
			addRow(diagram, step.index);
			break;
		case "remove-row":
			removeRow(diagram, step.index);
			break;
		default:
			unreachable(step);
	}
}
