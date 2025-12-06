import "./Editor.css";
import { CirclesThreeIcon, ScribbleIcon, TrashIcon } from "@phosphor-icons/react";
import { produce } from "immer";
import { useEffect, useMemo, useRef, useState } from "react";
import { height, width } from "../data/Diagram";
import { displayAxioms, type DragRule } from "../data/Lemma";
import type { Options } from "../data/Options";
import type { Proof } from "../data/Proof";
import { applyStep, reverseStep } from "../data/ProofStep";
import type { Workspace } from "../data/Workspace";
import type { Updater } from "../hooks";
import type { WorkspaceSelection } from "./App";
import Checkbox from "./Checkbox";
import DiagramView, { type DiagramMouseEvent } from "./DiagramView";
import Timeline from "./Timeline";
import ZoomControls from "./ZoomControls";

export default function LemmaEditor(
	{ workspace, updateWorkspace, options, updateOptions, index, setSelection, setDependencies }: {
		workspace: Workspace;
		updateWorkspace: Updater<Workspace>;
		options: Options;
		updateOptions: Updater<Options>;
		index: number;
		setSelection: React.Dispatch<React.SetStateAction<WorkspaceSelection>>;
		setDependencies: React.Dispatch<
			React.SetStateAction<{ lemmas: Set<number>; proofs: Set<number>; } | undefined>
		>;
	},
)
{
	const lemma = workspace.lemmas[index];
	const isAxiom = lemma.steps === null;

	const [name, setName] = useState(lemma.name);

	const track = workspace.ignoredAxioms[lemma.id] !== true;
	function setTrack(t: boolean)
	{
		updateWorkspace(w =>
		{
			if (t)
				delete w.ignoredAxioms[lemma.id];
			else
				w.ignoredAxioms[lemma.id] = true;
		});
	}

	const diagrams = useMemo(() =>
	{
		const diagrams = [lemma.lhs];
		if (lemma.steps === null)
			diagrams.push(lemma.rhs);
		else
		{
			for (const step of lemma.steps)
				diagrams.push(produce(diagrams.at(-1)!, d => applyStep(d, step, workspace.lemmas)));
		}
		return diagrams;
	}, []); // eslint-disable-line react-hooks/exhaustive-deps -- No dependencies should be changing while mounted.

	const [current, setCurrent] = useState<number>(0);

	const dragRules = current === 0
		? lemma.forwardRules
		: current === diagrams.length - 1
		? lemma.reverseRules
		: undefined;
	const [proposedDragRule, setProposedDragRule] = useState<DragRule>();

	const mainRef = useRef<HTMLDivElement>(null);

	useEffect(() =>
	{
		if (document.activeElement === null || document.activeElement === document.body)
			mainRef.current?.focus();
	});

	function onPointerDown(e: DiagramMouseEvent)
	{
		if (dragRules === undefined)
			return;

		setProposedDragRule({ from: { x: e.x, y: e.y }, to: { x: e.x, y: e.y }, altMode: e.raw.shiftKey });
	}

	function onPointerUp(e: DiagramMouseEvent)
	{
		setProposedDragRule(undefined);

		if (
			dragRules === undefined || proposedDragRule === undefined
			|| e.x < 0 || e.y < 0 || e.x >= width(diagrams[current]) || e.y >= height(diagrams[current])
		)
		{
			return;
		}

		const newRule = { ...proposedDragRule, to: { x: e.x, y: e.y }, altMode: e.raw.shiftKey };

		if (newRule.from.x === newRule.to.x && newRule.from.y === newRule.to.y)
			newRule.altMode = false;

		updateWorkspace(w =>
		{
			const rules = current === 0 ? w.lemmas[index].forwardRules : w.lemmas[index].reverseRules;
			const existingIndex = rules.findIndex(r =>
				r.from.x === newRule.from.x && r.from.y === newRule.from.y
				&& r.to.x === newRule.to.x && r.to.y === newRule.to.y
			);
			if (existingIndex >= 0)
				rules.splice(existingIndex, 1);
			else
				rules.push(newRule);
		});
	}

	function onPointerMove(e: DiagramMouseEvent)
	{
		if (dragRules === undefined || proposedDragRule === undefined)
			return;

		const to = e.x < 0 || e.y < 0 || e.x >= width(diagrams[current]) || e.y >= height(diagrams[current])
			? proposedDragRule.to
			: { x: e.x, y: e.y };
		setProposedDragRule({ ...proposedDragRule, to, altMode: e.raw.shiftKey });
	}

	function onKeyDown(e: React.KeyboardEvent)
	{
		if ((e.target as HTMLElement).tagName === "INPUT")
			return;

		if (e.key === "ArrowLeft" || e.key === "a")
			setCurrent(c => Math.max(0, c - 1));
		else if (e.key === "ArrowRight" || e.key === "d")
			setCurrent(c => Math.min(diagrams.length - 1, c + 1));
		else if (e.key === "Home")
			setCurrent(0);
		else if (e.key === "End")
			setCurrent(diagrams.length - 1);
	}

	function deleteLemma()
	{
		const lemmas = new Set<number>();
		for (let i = 0; i < workspace.lemmas.length; i++)
		{
			if (workspace.lemmas[i].steps?.some(s => s.type === "lemma" && s.id === lemma.id) === true)
				lemmas.add(i);
		}
		const proofs = new Set<number>();
		for (let i = 0; i < workspace.proofs.length; i++)
		{
			if (
				workspace.proofs[i].lhs?.[1].some(s => s.type === "lemma" && s.id === lemma.id) == true
				|| workspace.proofs[i].rhs?.[1].some(s => s.type === "lemma" && s.id === lemma.id) == true
			)
			{
				proofs.add(i);
			}
		}

		if (lemmas.size > 0 || proofs.size > 0)
		{
			setDependencies({ lemmas, proofs });
			return;
		}

		setSelection(undefined);
		updateWorkspace(w =>
		{
			w.lemmas.splice(index, 1);
		});
	}

	return (
		<div ref={mainRef} className="flex column main" tabIndex={0} onKeyDown={onKeyDown}>
			<div className="flex toolbar">
				<input
					value={name}
					data-conflict={name !== workspace.lemmas[index].name}
					style={{ width: 240 }}
					onChange={e =>
					{
						setName(e.target.value);
						updateWorkspace(w =>
						{
							if (!w.lemmas.some(l => l.name === e.target.value))
								w.lemmas[index].name = e.target.value;
						});
					}}
				/>
				<div style={{ width: "1em" }} />
				{isAxiom
					? <Checkbox label="Track usages" checked={track} onChange={setTrack} />
					: displayAxioms(lemma.axioms, workspace)}
				<div style={{ flex: 1 }} />
				<button onClick={deleteLemma}>
					<TrashIcon />
				</button>
				{ZoomControls(updateOptions)}
			</div>
			<div className="editor-panel">
				<div className="flex floating-toolbar">
					<div>
						<button>
							<CirclesThreeIcon
								weight="fill"
								onClick={() =>
								{
									const proof: Proof = lemma.steps === null
										? { lhs: [lemma.lhs, []], rhs: [lemma.rhs, []] }
										: {
											lhs: [lemma.lhs, lemma.steps.slice(0, current)],
											rhs: [lemma.rhs, lemma.steps.slice(current).map(reverseStep).reverse()],
										};
									setSelection({ type: "proof", index: workspace.proofs.length });
									updateWorkspace(w =>
									{
										w.proofs.push(proof);
									});
								}}
							/>
						</button>
					</div>
					<div>
						<button
							onClick={() =>
							{
								setSelection({ type: "diagram", index: workspace.diagrams.length });
								updateWorkspace(w =>
								{
									w.diagrams.push(diagrams[current]);
								});
							}}
						>
							<ScribbleIcon />
						</button>
					</div>
				</div>
				<div className="editor">
					<DiagramView
						diagram={diagrams[current]}
						scale={options.scale}
						theme={options.theme}
						dragRules={dragRules}
						proposedDragRule={proposedDragRule}
						onPointerDown={onPointerDown}
						onPointerUp={onPointerUp}
						onPointerMove={onPointerMove}
					/>
				</div>
			</div>
			<div className="flex" style={{ alignItems: "center", padding: "var(--gap)" }}>
				<Timeline length={diagrams.length} current={current} onSetCurrent={setCurrent} />
			</div>
		</div>
	);
}
