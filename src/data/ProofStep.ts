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
	isSubdiagram,
	paint,
	removeColumn,
	removeRow,
	width,
	writeSubdiagram,
} from "./Diagram";
import type { Lemma } from "./Lemma";
import type { Segment } from "./Tile";
import { composeTrans, Transform } from "./Transform";

type DragSegmentStep = {
	type: "drag-segment";
	trans: Transform;
	length: number;
};

type LemmaStep = {
	type: "lemma";
	id: string;
	reverse: boolean;
	trans: Transform;
	colourMap: number[];
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

export type ProofStep =
	| DragSegmentStep
	| LemmaStep
	| PaintStep
	| AddColumnStep
	| RemoveColumnStep
	| AddRowStep
	| RemoveRowStep;

export function isValid(diagram: Diagram, step: ProofStep, context: Lemma[]): string | undefined
{
	switch (step.type)
	{
		case "drag-segment":
			return isDraggableSegmentValid(diagram, step.trans, step.length);
		case "lemma":
		{
			const lemma = context.find(l => l.id === step.id);
			if (lemma === undefined)
				return `Lemma with ID "${step.id}" does not exist.`;

			if (
				!isSubdiagram(
					step.reverse ? lemma.rhs : lemma.lhs,
					step.reverse ? lemma.lhs : lemma.rhs,
					diagram,
					step.trans,
					step.colourMap,
				)
			)
			{
				return `The targeted location does not match the ${step.reverse ? "right" : "left"}-hand side of `
					+ `"${lemma.name}".`;
			}
			return undefined;
		}
		case "paint":
		{
			const [arc, terminated] = getArc(diagram, step, step.segment);
			if (!terminated)
				return "Painting an arc on the perimeter of the diagram is not allowed.";
			if (!arc.every(([point, seg]) => get(diagram, point)?.colours[seg] === step.from))
				return `The painted arc does not match the expected colour (${step.from}).`;
			return undefined;
		}
		case "add-column":
			if (step.index < 0 || step.index > width(diagram))
				return `Column index ${step.index} is out of bounds.`;
			return undefined;
		case "remove-column":
			for (let i = 0; i < height(diagram); i++)
			{
				const tile = get(diagram, { x: step.index, y: i });
				if (tile === undefined)
					return `Column index ${step.index} is out of bounds.`;
				if (tile.type !== " " && tile.type !== "-")
					return `Column ${step.index} cannot be removed without causing a discontinuity.`;
			}
			return undefined;
		case "add-row":
			if (step.index < 0 || step.index > height(diagram))
				return `Row index ${step.index} is out of bounds.`;
			return undefined;
		case "remove-row":
			for (let i = 0; i < width(diagram); i++)
			{
				const tile = get(diagram, { x: i, y: step.index });
				if (tile === undefined)
					return `Row index ${step.index} is out of bounds.`;
				if (tile.type !== " " && tile.type !== "|")
					return `Row ${step.index} cannot be removed without causing a discontinuity.`;
			}
			return undefined;
		default:
			unreachable(step);
	}
}

export function applyStep(diagram: Diagram, step: ProofStep, context: Lemma[])
{
	switch (step.type)
	{
		case "drag-segment":
			dragSegment(diagram, step.trans, step.length);
			break;
		case "lemma":
		{
			const lemma = context.find(l => l.id === step.id);
			if (lemma === undefined)
				throw new Error("nonexistent lemma");

			writeSubdiagram(
				step.reverse ? lemma.lhs : lemma.rhs,
				step.reverse ? lemma.rhs : lemma.lhs,
				diagram,
				step.trans,
				step.colourMap,
			);
			break;
		}
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
		case "lemma":
			return { ...step, reverse: !step.reverse };
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
