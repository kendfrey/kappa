import "./Editor.css";
import {
	ArrowCounterClockwiseIcon,
	ArrowsLeftRightIcon,
	ArrowsOutLineHorizontalIcon,
	ArrowsOutLineVerticalIcon,
	CirclesThreeIcon,
	HandIcon,
	HandTapIcon,
	LinkSimpleHorizontalIcon,
	PaintBrushHouseholdIcon,
	ScribbleIcon,
	TrashIcon,
} from "@phosphor-icons/react";
import { produce } from "immer";
import { useEffect, useMemo, useRef, useState } from "react";
import { Diagram, findDraggableSegment, get, getArc, getSignature, getTrans, height, width } from "../data/Diagram";
import { calculateAxioms, displayAxioms, type DragRule, type Lemma } from "../data/Lemma";
import type { Options } from "../data/Options";
import type { Point } from "../data/Point";
import type { Proof } from "../data/Proof";
import { applyStep, isValid, type ProofStep, reverseStep } from "../data/ProofStep";
import { composeTrans, symmetries, Transform, transformPoint } from "../data/Transform";
import type { Workspace } from "../data/Workspace";
import { type Updater, useImmerState } from "../hooks";
import type { WorkspaceSelection } from "./App";
import ColourSelect from "./ColourSelect";
import DiagramView, { type DiagramMouseEvent } from "./DiagramView";
import Timeline from "./Timeline";
import ZoomControls from "./ZoomControls";

export default function ProofEditor({ workspace, updateWorkspace, options, updateOptions, index, setSelection }: {
	workspace: Workspace;
	updateWorkspace: Updater<Workspace>;
	options: Options;
	updateOptions: Updater<Options>;
	index: number;
	setSelection: React.Dispatch<React.SetStateAction<WorkspaceSelection>>;
})
{
	const [coordinatedState, updateCoordinatedState] = useImmerState<CoordinatedState>(() =>
	{
		const proof = workspace.proofs[index];

		return ({
			proof,
			current: proof.lhs !== null
				? { side: "lhs", index: proof.lhs[1].length }
				: proof.rhs !== null
				? { side: "rhs", index: proof.rhs[1].length }
				: { side: "lhs", index: 0 },
			lhsDiagrams: buildDiagrams(proof.lhs, workspace.lemmas),
			rhsDiagrams: buildDiagrams(proof.rhs, workspace.lemmas),
			dragAnchor: undefined,
			dragCursor: undefined,
			rowCol: undefined,
		});
	});

	// Sync external changes into this component's state.
	useEffect(() =>
	{
		// For simplicity, this effect ignores any external changes except setting the LHS or RHS.
		updateCoordinatedState(s =>
		{
			if (s.proof.lhs === null && workspace.proofs[index].lhs !== null)
			{
				s.proof.lhs = workspace.proofs[index].lhs;
				s.lhsDiagrams = buildDiagrams(s.proof.lhs, workspace.lemmas);
			}
			if (s.proof.rhs === null && workspace.proofs[index].rhs !== null)
			{
				s.proof.rhs = workspace.proofs[index].rhs;
				s.rhsDiagrams = buildDiagrams(s.proof.rhs, workspace.lemmas);
			}
		});
	}, [workspace, index, updateCoordinatedState]);

	// Sync changes from this component's state back to the workspace.
	useEffect(() =>
	{
		updateWorkspace(w =>
		{
			w.proofs[index] = coordinatedState.proof;
		});
	}, [coordinatedState.proof, index, updateWorkspace]);

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

	const axioms = useMemo(() =>
		displayAxioms(
			calculateAxioms([
				...coordinatedState.proof.lhs?.[1] ?? [],
				...coordinatedState.proof.rhs?.[1] ?? [],
			], workspace.lemmas),
			workspace,
		), [coordinatedState.proof, workspace]);

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

	const [dragLemmas, altDragLemmas] = useMemo(() =>
	{
		const dragLemmas = new Map<string, [Lemma, Transform, boolean][]>();
		const altDragLemmas = new Map<string, [Lemma, Transform, boolean][]>();
		for (const lemma of workspace.lemmas.filter(l => l.enabled))
		{
			addRules(lemma.forwardRules, false);
			addRules(lemma.reverseRules, true);

			function addRules(rules: DragRule[], reverse: boolean)
			{
				for (const rule of rules)
				{
					const delta = { x: rule.to.x - rule.from.x, y: rule.to.y - rule.from.y };
					for (const symm of symmetries)
					{
						const transformedDelta = transformPoint(delta, Transform(0, 0, symm));
						const transform = composeTrans(
							Transform(-rule.from.x, -rule.from.y, "0"),
							Transform(0, 0, symm),
						);
						const key = `${transformedDelta.x},${transformedDelta.y}`;
						const lemmas = rule.altMode ? altDragLemmas : dragLemmas;
						if (!lemmas.has(key))
							lemmas.set(key, []);
						lemmas.get(key)!.push([lemma, transform, reverse]);
					}
				}
			}
		}
		return [dragLemmas, altDragLemmas];
	}, [workspace.lemmas]);

	let currentStepDescription = null;
	if (coordinatedState.current.index > 0)
	{
		const step = coordinatedState.proof[coordinatedState.current.side]?.[1][coordinatedState.current.index - 1];
		if (step?.type === "lemma")
			currentStepDescription = workspace.lemmas.find(l => l.id === step.id)?.name ?? step.id;
	}

	const canDeleteSide = coordinatedState.proof.lhs !== null && coordinatedState.proof.rhs !== null;

	const canLemma = useMemo(
		() =>
			coordinatedState.proof.lhs === null && (coordinatedState.proof.rhs?.[1].length ?? 0) > 0
				&& getSignature(coordinatedState.rhsDiagrams[0]) === getSignature(coordinatedState.rhsDiagrams.at(-1)!)
			|| coordinatedState.proof.rhs === null && (coordinatedState.proof.lhs?.[1].length ?? 0) > 0
				&& getSignature(coordinatedState.lhsDiagrams[0]) === getSignature(coordinatedState.lhsDiagrams.at(-1)!)
			|| JSON.stringify(coordinatedState.lhsDiagrams.at(-1))
				=== JSON.stringify(coordinatedState.rhsDiagrams.at(-1)),
		[coordinatedState],
	);

	const canAxiom = useMemo(
		() => coordinatedState.proof.lhs?.[1].length === 0 && coordinatedState.proof.rhs?.[1].length === 0,
		[coordinatedState.proof],
	);

	const cursor = useMemo(() =>
	{
		if (!editable)
			return "not-allowed";

		switch (tool)
		{
			case "drag":
				return coordinatedState.dragAnchor !== undefined ? "grabbing" : "grab";
			case "poke":
				return "pointer";
			case "column":
				return "col-resize";
			case "row":
				return "row-resize";
			default:
				return undefined;
		}
	}, [editable, coordinatedState, tool]);

	const [isDragging, setIsDragging] = useState(false);

	const mainRef = useRef<HTMLDivElement>(null);

	useEffect(() =>
	{
		if (document.activeElement === null || document.activeElement === document.body)
			mainRef.current?.focus();
	});

	function onClick(e: DiagramMouseEvent)
	{
		if (!editable)
			return;

		switch (tool)
		{
			case "poke":
			{
				if (diagram === undefined)
					return;

				const step = getLemmaDragStep(diagram, { x: e.x, y: e.y }, { x: e.x, y: e.y }, dragLemmas, true);
				if (step !== undefined)
				{
					updateCoordinatedState(s =>
					{
						doStep(s, step[0]);
					});
				}
				break;
			}
		}
	}

	function onPointerDown(e: DiagramMouseEvent)
	{
		if (!editable)
			return;

		setIsDragging(true);

		switch (tool)
		{
			case "drag":
				updateCoordinatedState(s =>
				{
					s.dragAnchor = { x: e.x, y: e.y };
					s.dragCursor = { x: e.x, y: e.y };
				});
				break;
			case "paint":
			{
				if (diagram === undefined)
					return;

				const root = getArc(diagram, e, e.segment)[0][0];
				if (root === undefined)
					return;

				const from = get(diagram, root[0])?.colours[root[1]];
				if (from === undefined)
					return;

				updateCoordinatedState(s =>
				{
					doStep(s, { type: "paint", x: e.x, y: e.y, segment: e.segment, from, to: colour });
				});
				break;
			}
		}
	}

	function onPointerUp()
	{
		setIsDragging(false);

		updateCoordinatedState(s =>
		{
			s.dragAnchor = undefined;
		});
	}

	function onPointerMove(e: DiagramMouseEvent)
	{
		if (!editable)
			return;

		switch (tool)
		{
			case "drag":
				onDrag(e);
				break;
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
			s.dragCursor = undefined;
		});
	}

	function onKeyDown(e: React.KeyboardEvent)
	{
		if ((e.target as HTMLElement).tagName === "INPUT")
			return;

		if ((e.ctrlKey || e.metaKey) && e.key === "z" || e.key === "Backspace")
		{
			updateCoordinatedState(s =>
			{
				const side = s.current.side;
				if (
					s.proof[side] === null
					|| s.proof[side][1].length === 0
					|| s.current.index !== s.proof[side][1].length
				)
				{
					return;
				}

				s.proof[side][1].pop();
				(side === "lhs" ? s.lhsDiagrams : s.rhsDiagrams).pop();
				s.current.index = s.proof[side][1].length;
			});
		}
		else if (e.key === "ArrowLeft" || e.key === "a")
		{
			updateCoordinatedState(s =>
			{
				if (s.current.side === "lhs")
				{
					if (s.current.index > 0)
						s.current.index--;
				}
				else if (s.proof.rhs !== null && s.current.index < s.proof.rhs[1].length)
					s.current.index++;
				else if (s.proof.lhs !== null)
				{
					s.current.side = "lhs";
					s.current.index = s.proof.lhs[1].length;
				}
			});
		}
		else if (e.key === "ArrowRight" || e.key === "d")
		{
			updateCoordinatedState(s =>
			{
				if (s.current.side === "rhs")
				{
					if (s.current.index > 0)
						s.current.index--;
				}
				else if (s.proof.lhs !== null && s.current.index < s.proof.lhs[1].length)
					s.current.index++;
				else if (s.proof.rhs !== null)
				{
					s.current.side = "rhs";
					s.current.index = s.proof.rhs[1].length;
				}
			});
		}
		else if (e.key === "Home")
		{
			updateCoordinatedState(s =>
			{
				if (
					s.current.side === "lhs"
					|| (s.current.side === "rhs"
						&& s.proof.lhs !== null
						&& s.proof.rhs !== null
						&& s.current.index === s.proof.rhs[1].length)
				)
				{
					s.current.side = "lhs";
					s.current.index = 0;
				}
				else if (s.proof.rhs !== null)
				{
					s.current.index = s.proof.rhs[1].length;
				}
			});
		}
		else if (e.key === "End")
		{
			updateCoordinatedState(s =>
			{
				if (
					s.current.side === "rhs"
					|| (s.current.side === "lhs"
						&& s.proof.rhs !== null
						&& s.proof.lhs !== null
						&& s.current.index === s.proof.lhs[1].length)
				)
				{
					s.current.side = "rhs";
					s.current.index = 0;
				}
				else if (s.proof.lhs !== null)
				{
					s.current.index = s.proof.lhs[1].length;
				}
			});
		}
	}

	function onDrag(e: DiagramMouseEvent)
	{
		updateCoordinatedState(s =>
		{
			if (s.dragAnchor === undefined || s.dragCursor === undefined)
			{
				s.dragCursor = { x: e.x, y: e.y };
				return;
			}

			while (s.dragCursor.x < e.x)
			{
				s.dragCursor.x++;
				tryDrag(s, e);
			}
			while (s.dragCursor.x > e.x)
			{
				s.dragCursor.x--;
				tryDrag(s, e);
			}
			while (s.dragCursor.y < e.y)
			{
				s.dragCursor.y++;
				tryDrag(s, e);
			}
			while (s.dragCursor.y > e.y)
			{
				s.dragCursor.y--;
				tryDrag(s, e);
			}
		});
	}

	function tryDrag(s: CoordinatedState, e: DiagramMouseEvent)
	{
		const step = getDragStep(s, e);
		if (step !== undefined && doStep(s, step[0]))
			s.dragAnchor = step[1];
	}

	function getDragStep(s: CoordinatedState, e: DiagramMouseEvent): [ProofStep, Point] | undefined
	{
		if (s.dragAnchor === undefined || s.dragCursor === undefined)
			return;

		const side = s.current.side;
		if (s.proof[side] === null)
			return;

		const diagrams = side === "lhs" ? s.lhsDiagrams : s.rhsDiagrams;
		const diagram = diagrams[s.proof[side][1].length];

		if (!e.raw.ctrlKey)
		{
			const segment = getSegmentDragStep(diagram, s.dragAnchor, s.dragCursor);
			if (segment !== undefined)
				return [{ type: "drag-segment", ...segment[0] }, segment[1]];
		}

		const primaryRules = e.raw.shiftKey ? altDragLemmas : dragLemmas;
		const secondaryRules = e.raw.shiftKey ? dragLemmas : altDragLemmas;
		const lemma = getLemmaDragStep(diagram, s.dragAnchor, s.dragCursor, primaryRules)
			?? getLemmaDragStep(diagram, s.dragAnchor, s.dragCursor, secondaryRules);
		if (lemma !== undefined)
			return lemma;
	}

	function getSegmentDragStep(
		diagram: Diagram,
		from: Point,
		to: Point,
	): [{ trans: Transform; length: number; }, Point] | undefined
	{
		if (to.x === from.x + 1)
		{
			const segment = findDraggableSegment(diagram, Transform(from.x, from.y, "3"));
			if (segment !== undefined)
				return [segment, { x: from.x + 1, y: from.y }];
		}
		if (to.x === from.x - 1)
		{
			const segment = findDraggableSegment(diagram, Transform(from.x, from.y, "1"));
			if (segment !== undefined)
				return [segment, { x: from.x - 1, y: from.y }];
		}
		if (to.y === from.y + 1)
		{
			const segment = findDraggableSegment(diagram, Transform(from.x, from.y, "0"));
			if (segment !== undefined)
				return [segment, { x: from.x, y: from.y + 1 }];
		}
		if (to.y === from.y - 1)
		{
			const segment = findDraggableSegment(diagram, Transform(from.x, from.y, "2"));
			if (segment !== undefined)
				return [segment, { x: from.x, y: from.y - 1 }];
		}
	}

	function getLemmaDragStep(
		diagram: Diagram,
		from: Point,
		to: Point,
		rulesMap: Map<string, [Lemma, Transform, boolean][]>,
		poke: boolean = false,
	): [ProofStep, Point] | undefined
	{
		const delta = { x: to.x - from.x, y: to.y - from.y };
		if (delta.x === 0 && delta.y === 0 && !poke)
			return undefined;

		const rules = rulesMap.get(`${delta.x},${delta.y}`);
		if (rules === undefined)
			return undefined;

		nextRule:
		for (const [lemma, baseTransform, reverse] of rules)
		{
			const transform = composeTrans(baseTransform, Transform(from.x, from.y, "0"));
			const fromDiagram = reverse ? lemma.rhs : lemma.lhs;
			const toDiagram = reverse ? lemma.lhs : lemma.rhs;
			const colourMap: (number | undefined)[] = options.theme.colours.map(() => undefined);

			for (let y = 0; y < height(fromDiagram); y++)
			{
				for (let x = 0; x < width(fromDiagram); x++)
				{
					const tile = getTrans(diagram, { x, y }, transform);
					const fromTile = get(fromDiagram, { x, y });
					const toTile = get(toDiagram, { x, y });

					if (fromTile === undefined || toTile === undefined)
						continue nextRule;

					if (fromTile.type === " " && toTile.type === " ")
						continue;

					if (tile === undefined || tile.type !== fromTile.type)
						continue nextRule;

					for (let i = 0; i < fromTile.colours.length; i++)
					{
						const fromColour = fromTile.colours[i];
						const colour = tile.colours[i];

						if (colourMap[fromColour] === undefined)
							colourMap[fromColour] = colour;
						else if (colourMap[fromColour] !== colour)
							continue nextRule;
					}
				}
			}

			const fallbackColour = colourMap.find(c => c !== undefined) ?? 0;
			const step: ProofStep = {
				type: "lemma",
				id: lemma.id,
				reverse,
				trans: transform,
				colourMap: colourMap.map(c => c ?? fallbackColour),
			};
			return [step, to];
		}
		return undefined;
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

		if (isValid(diagram, step, workspace.lemmas) !== undefined)
			return false;

		s.proof[side][1].push(step);
		s.current.index = s.proof[side][1].length;
		diagrams.push(produce(diagram, d => applyStep(d, step, workspace.lemmas)));
		return true;
	}

	function makeLemma()
	{
		const id = crypto.randomUUID();
		let name: string;
		for (let i = 1;; i++)
		{
			name = `lemma${i}`;
			if (!workspace.lemmas.some(l => l.name === name))
				break;
		}

		let lhs, rhs, steps;
		if (coordinatedState.proof.lhs === null)
		{
			if (coordinatedState.proof.rhs === null)
				return;

			lhs = coordinatedState.rhsDiagrams.at(-1)!;
			rhs = coordinatedState.proof.rhs[0];
			steps = coordinatedState.proof.rhs[1].map(reverseStep).reverse();
		}
		else if (coordinatedState.proof.rhs === null)
		{
			lhs = coordinatedState.proof.lhs[0];
			rhs = coordinatedState.lhsDiagrams.at(-1)!;
			steps = coordinatedState.proof.lhs[1];
		}
		else
		{
			lhs = coordinatedState.proof.lhs[0];
			rhs = coordinatedState.proof.rhs[0];
			steps = coordinatedState.proof.lhs[1].concat(
				coordinatedState.proof.rhs[1].map(reverseStep).reverse(),
			);
		}

		const lemma: Lemma = {
			id,
			name,
			lhs,
			rhs,
			steps,
			forwardRules: [],
			reverseRules: [],
			enabled: true,
			axioms: calculateAxioms(steps, workspace.lemmas),
		};

		setSelection({ type: "lemma", index: workspace.lemmas.length });
		updateWorkspace(w =>
		{
			w.proofs.splice(index, 1);
			w.lemmas.push(lemma);
		});
	}

	function makeAxiom()
	{
		if (coordinatedState.proof.lhs === null || coordinatedState.proof.rhs === null)
			return;

		const id = crypto.randomUUID();
		let name: string;
		for (let i = 1;; i++)
		{
			name = `axiom${i}`;
			if (!workspace.lemmas.some(l => l.name === name))
				break;
		}
		const axiom: Lemma = {
			id,
			name,
			lhs: coordinatedState.proof.lhs[0],
			rhs: coordinatedState.proof.rhs[0],
			steps: null,
			forwardRules: [],
			reverseRules: [],
			enabled: true,
			axioms: { [id]: 1 },
		};

		setSelection({ type: "lemma", index: workspace.lemmas.length });
		updateWorkspace(w =>
		{
			w.proofs.splice(index, 1);
			w.lemmas.push(axiom);
		});
	}

	return (
		<div ref={mainRef} className="flex column main" tabIndex={0} onKeyDown={onKeyDown}>
			<div className="flex toolbar">
				{editable
					? (
						<>
							<button onClick={() => setTool("drag")} data-selected={tool === "drag"}>
								<HandIcon />
							</button>
							<button onClick={() => setTool("poke")} data-selected={tool === "poke"}>
								<HandTapIcon />
							</button>
							<button onClick={() => setTool("paint")} data-selected={tool === "paint"}>
								<PaintBrushHouseholdIcon />
							</button>
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
				<div style={{ width: "1em" }} />
				{axioms}
				<div style={{ flex: 1 }} />
				<button
					onClick={() =>
					{
						setSelection(undefined);
						updateWorkspace(w =>
						{
							w.proofs.splice(index, 1);
						});
					}}
				>
					<TrashIcon />
				</button>
				{ZoomControls(updateOptions)}
			</div>
			<div className="editor">
				<DiagramView
					diagram={diagram ?? Diagram(1, 1)}
					dragAnchor={coordinatedState.dragAnchor ?? coordinatedState.dragCursor}
					dragColumn={tool === "column" ? coordinatedState.rowCol : undefined}
					dragRow={tool === "row" ? coordinatedState.rowCol : undefined}
					cursor={cursor}
					scale={options.scale}
					theme={options.theme}
					onClick={onClick}
					onPointerDown={onPointerDown}
					onPointerUp={onPointerUp}
					onPointerMove={onPointerMove}
					onPointerLeave={onPointerLeave}
				/>
			</div>
			<div className="flex column navbar">
				<div className="flex" style={{ alignItems: "center" }}>
					<span style={{ flex: 1 }}>{currentStepDescription}</span>
					{canLemma
						? (
							<button className="text-button" onClick={makeLemma}>
								<CirclesThreeIcon weight="fill" />
								Make Lemma
							</button>
						)
						: canAxiom
						? (
							<button className="text-button" onClick={makeAxiom}>
								<LinkSimpleHorizontalIcon />
								Make Axiom
							</button>
						)
						: null}
					<div className="flex" style={{ flex: 1, justifyContent: "end" }}>
						<button
							onClick={() =>
							{
								setSelection({ type: "diagram", index: workspace.diagrams.length });
								updateWorkspace(w =>
								{
									w.diagrams.push(diagram);
								});
							}}
						>
							<ScribbleIcon />
						</button>
					</div>
				</div>
				<div className="flex" style={{ alignItems: "center" }}>
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
			</div>
		</div>
	);
}

type CoordinatedState = {
	proof: Proof;
	current: { side: "lhs" | "rhs"; index: number; };
	lhsDiagrams: Diagram[];
	rhsDiagrams: Diagram[];
	dragAnchor: Point | undefined;
	dragCursor: Point | undefined;
	rowCol: number | undefined;
};

function buildDiagrams(side: [Diagram, ProofStep[]] | null, context: Lemma[]): Diagram[]
{
	const diagrams: Diagram[] = [];
	if (side !== null)
	{
		diagrams.push(side[0]);

		for (const step of side[1])
			diagrams.push(produce(diagrams[diagrams.length - 1], d => applyStep(d, step, context)));
	}
	return diagrams;
}
