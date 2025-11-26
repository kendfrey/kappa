import { unreachable } from "../util";
import {
	addColumn,
	addRow,
	type Diagram,
	dragSegment,
	get,
	getArc,
	height,
	isDraggableSegmentValid,
	paint,
	removeColumn,
	removeRow,
	width,
} from "./Diagram";
import type { Segment } from "./Tile";
import { composeTrans, Transform } from "./Transform";

type DragSegmentStep = {
	type: "drag-segment";
	trans: Transform;
	length: number;
};

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

export type ProofStep = DragSegmentStep | PaintStep | AddColumnStep | RemoveColumnStep | AddRowStep | RemoveRowStep;

export function isValid(diagram: Diagram, step: ProofStep): boolean
{
	switch (step.type)
	{
		case "drag-segment":
			return isDraggableSegmentValid(diagram, step.trans, step.length);
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
		case "drag-segment":
			dragSegment(diagram, step.trans, step.length);
			break;
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

export function reverseStep(step: ProofStep): ProofStep
{
	switch (step.type)
	{
		case "drag-segment":
			return { ...step, trans: composeTrans(Transform(step.length, 1, "2"), step.trans) };
		case "paint":
			return { ...step, to: step.from, from: step.to };
		case "add-column":
			return { type: "remove-column", index: step.index };
		case "remove-column":
			return { type: "add-column", index: step.index };
		case "add-row":
			return { type: "remove-row", index: step.index };
		case "remove-row":
			return { type: "add-row", index: step.index };
	}
}
