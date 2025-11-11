import "./Editor.css";
import {
	ArrowCounterClockwiseIcon,
	ArrowsLeftRightIcon,
	ArrowsOutLineHorizontalIcon,
	ArrowsOutLineVerticalIcon,
	TrashIcon,
} from "@phosphor-icons/react";
import { produce } from "immer";
import { useEffect, useMemo, useState } from "react";
import type { Context } from "../data/Context";
import { Diagram } from "../data/Diagram";
import type { Options } from "../data/Options";
import type { Proof } from "../data/Proof";
import { applyStep, isValid, type ProofStep } from "../data/ProofStep";
import { type Updater, useImmerState } from "../hooks";
import ColourSelect from "./ColourSelect";
import DiagramView, { type DiagramPointerEvent } from "./DiagramView";
import Timeline from "./Timeline";

export default function ProofEditor({ context, updateContext, options, updateOptions, index }: {
	context: Context;
	updateContext: Updater<Context>;
	options: Options;
	updateOptions: Updater<Options>;
	index: number;
})
{
	const [coordinatedState, updateCoordinatedState] = useImmerState<CoordinatedState>(() =>
	{
		const proof = context.proofs[index];

		return ({
			proof,
			current: proof.lhs !== null
				? { side: "lhs", index: proof.lhs[1].length }
				: proof.rhs !== null
				? { side: "rhs", index: proof.rhs[1].length }
				: { side: "lhs", index: 0 },
			lhsDiagrams: buildDiagrams(proof.lhs),
			rhsDiagrams: buildDiagrams(proof.rhs),
			rowCol: undefined,
		});
	});

	// Sync external changes into this component's state.
	useEffect(() =>
	{
		// For simplicity, this effect ignores any external changes except setting the LHS or RHS.
		updateCoordinatedState(s =>
		{
			if (s.proof.lhs === null && context.proofs[index].lhs !== null)
			{
				s.proof.lhs = context.proofs[index].lhs;
				s.lhsDiagrams = buildDiagrams(s.proof.lhs);
			}
			if (s.proof.rhs === null && context.proofs[index].rhs !== null)
			{
				s.proof.rhs = context.proofs[index].rhs;
				s.rhsDiagrams = buildDiagrams(s.proof.rhs);
			}
		});
	}, [context.proofs, index, updateCoordinatedState]);

	// Sync changes from this component's state back to the context.
	useEffect(() =>
	{
		updateContext(c =>
		{
			c.proofs[index] = coordinatedState.proof;
		});
	}, [coordinatedState.proof, index, updateContext]);

	const tool = options.selectedProofEditorTool;
	function setTool(t: Options["selectedProofEditorTool"])
	{
		updateOptions(o =>
		{
			o.selectedProofEditorTool = t;
		});
	}

	const colour = options.selectedColour;
	function setColour(c: number)
	{
		updateOptions(o =>
		{
			o.selectedColour = c;
		});
	}

	let diagram: Diagram | undefined;
	let editable: boolean;
	switch (coordinatedState.current.side)
	{
		case "lhs":
			diagram = coordinatedState.lhsDiagrams[coordinatedState.current.index];
			editable = diagram !== undefined
				&& coordinatedState.current.index === coordinatedState.proof.lhs?.[1].length;
			break;
		case "rhs":
			diagram = coordinatedState.rhsDiagrams[coordinatedState.current.index];
			editable = diagram !== undefined
				&& coordinatedState.current.index === coordinatedState.proof.rhs?.[1].length;
			break;
	}

	const canDeleteSide = coordinatedState.proof.lhs !== null && coordinatedState.proof.rhs !== null;

	const cursor = useMemo(() =>
	{
		if (!editable)
			return "not-allowed";

		switch (tool)
		{
			case "column":
				return "col-resize";
			case "row":
				return "row-resize";
			default:
				return undefined;
		}
	}, [editable, tool]);

	const [isDragging, setIsDragging] = useState(false);

	function onPointerDown()
	{
		if (!editable)
			return;

		setIsDragging(true);
	}

	function onPointerUp()
	{
		setIsDragging(false);
	}

	function onPointerMove(e: DiagramPointerEvent)
	{
		if (!editable)
			return;

		switch (tool)
		{
			case "column":
				onDragRowCol(e.columnBorder);
				break;
			case "row":
				onDragRowCol(e.rowBorder);
				break;
		}
	}

	function onPointerLeave()
	{
		updateCoordinatedState(s =>
		{
			s.rowCol = undefined;
		});
	}

	function onDragRowCol(to: number)
	{
		updateCoordinatedState(s =>
		{
			if (!isDragging || s.rowCol === undefined)
			{
				s.rowCol = to;
				return;
			}
			while (
				s.rowCol < to
				&& doStep(s, { type: tool === "column" ? "add-column" : "add-row", index: s.rowCol })
			)
			{
				s.rowCol++;
			}
			while (
				s.rowCol > to
				&& doStep(s, { type: tool === "column" ? "remove-column" : "remove-row", index: s.rowCol - 1 })
			)
			{
				s.rowCol--;
			}
		});
	}

	function doStep(s: CoordinatedState, step: ProofStep): boolean
	{
		const side = s.current.side;
		if (s.proof[side] === null)
			return false;

		const diagrams = side === "lhs" ? s.lhsDiagrams : s.rhsDiagrams;
		const diagram = diagrams[s.proof[side][1].length];

		if (!isValid(diagram, step))
			return false;

		s.proof[side][1].push(step);
		s.current.index = s.proof[side][1].length;
		diagrams.push(produce(diagram, d => applyStep(d, step)));
		return true;
	}

	return (
		<>
			<div className="flex toolbar">
				{editable
					? (
						<>
							<button onClick={() => setTool("column")} data-selected={tool === "column"}>
								<ArrowsOutLineHorizontalIcon />
							</button>
							<button onClick={() => setTool("row")} data-selected={tool === "row"}>
								<ArrowsOutLineVerticalIcon />
							</button>
							<ColourSelect colour={colour} setColour={setColour} theme={options.theme} />
						</>
					)
					: (
						<>
							<button
								onClick={() =>
								{
									updateCoordinatedState(s =>
									{
										const side = s.current.side;
										if (s.proof[side] === null)
											return;

										s.proof[side][1].splice(s.current.index);
										(side === "lhs" ? s.lhsDiagrams : s.rhsDiagrams).splice(s.current.index + 1);
									});
								}}
							>
								<ArrowCounterClockwiseIcon />
							</button>
						</>
					)}
			</div>
			<div className="editor">
				<DiagramView
					diagram={diagram ?? Diagram(1, 1)}
					dragColumn={tool === "column" ? coordinatedState.rowCol : undefined}
					dragRow={tool === "row" ? coordinatedState.rowCol : undefined}
					cursor={cursor}
					scale={64}
					theme={options.theme}
					onPointerDown={onPointerDown}
					onPointerUp={onPointerUp}
					onPointerMove={onPointerMove}
					onPointerLeave={onPointerLeave}
				/>
			</div>
			<div className="flex" style={{ alignItems: "center", padding: "var(--gap)" }}>
				{canDeleteSide && (
					<button
						onClick={() =>
						{
							updateCoordinatedState(s =>
							{
								if (s.proof.rhs == null)
									return;

								s.proof.lhs = null;
								s.lhsDiagrams = [];
								if (s.current.side === "lhs")
									s.current = { side: "rhs", index: s.proof.rhs[1].length };
							});
						}}
					>
						<TrashIcon />
					</button>
				)}
				<Timeline
					length={(coordinatedState.proof.lhs?.[1].length ?? -1) + 1}
					current={coordinatedState.current.side === "lhs" ? coordinatedState.current.index : undefined}
					onSetCurrent={i =>
						updateCoordinatedState(s =>
						{
							s.current = { side: "lhs", index: i };
						})}
				/>
				<button
					onClick={() =>
					{
						updateCoordinatedState(s =>
						{
							const tmp = s.proof.lhs;
							s.proof.lhs = s.proof.rhs;
							s.proof.rhs = tmp;
							const tmpDiagrams = s.lhsDiagrams;
							s.lhsDiagrams = s.rhsDiagrams;
							s.rhsDiagrams = tmpDiagrams;
							s.current.side = s.current.side === "lhs" ? "rhs" : "lhs";
						});
					}}
				>
					<ArrowsLeftRightIcon />
				</button>
				<Timeline
					length={(coordinatedState.proof.rhs?.[1].length ?? -1) + 1}
					current={coordinatedState.current.side === "rhs" ? coordinatedState.current.index : undefined}
					direction="rtl"
					onSetCurrent={i =>
						updateCoordinatedState(s =>
						{
							s.current = { side: "rhs", index: i };
						})}
				/>
				{canDeleteSide && (
					<button
						onClick={() =>
						{
							updateCoordinatedState(s =>
							{
								if (s.proof.lhs == null)
									return;

								s.proof.rhs = null;
								s.rhsDiagrams = [];
								if (s.current.side === "rhs")
									s.current = { side: "lhs", index: s.proof.lhs[1].length };
							});
						}}
					>
						<TrashIcon />
					</button>
				)}
			</div>
		</>
	);
}

type CoordinatedState = {
	proof: Proof;
	current: { side: "lhs" | "rhs"; index: number; };
	lhsDiagrams: Diagram[];
	rhsDiagrams: Diagram[];
	rowCol: number | undefined;
};

function buildDiagrams(side: [Diagram, ProofStep[]] | null): Diagram[]
{
	const diagrams: Diagram[] = [];
	if (side !== null)
	{
		diagrams.push(side[0]);

		for (const step of side[1])
			diagrams.push(produce(diagrams[diagrams.length - 1], d => applyStep(d, step)));
	}
	return diagrams;
}
