import "./Editor.css";
import { produce } from "immer";
import { useMemo, useState } from "react";
import { height, width } from "../data/Diagram";
import type { DragRule } from "../data/Lemma";
import type { Options } from "../data/Options";
import { applyStep } from "../data/ProofStep";
import type { Workspace } from "../data/Workspace";
import type { Updater } from "../hooks";
import Checkbox from "./Checkbox";
import DiagramView, { type DiagramPointerEvent } from "./DiagramView";
import Timeline from "./Timeline";
import ZoomControls from "./ZoomControls";

export default function LemmaEditor({ workspace, updateWorkspace, options, updateOptions, index }: {
	workspace: Workspace;
	updateWorkspace: Updater<Workspace>;
	options: Options;
	updateOptions: Updater<Options>;
	index: number;
})
{
	const lemma = workspace.lemmas[index];
	const isAxiom = lemma.steps === null;

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

	function onPointerDown(e: DiagramPointerEvent)
	{
		if (dragRules === undefined)
			return;

		setProposedDragRule({ from: { x: e.x, y: e.y }, to: { x: e.x, y: e.y }, altMode: e.raw.shiftKey });
	}

	function onPointerUp(e: DiagramPointerEvent)
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

	function onPointerMove(e: DiagramPointerEvent)
	{
		if (dragRules === undefined || proposedDragRule === undefined)
			return;

		const to = e.x < 0 || e.y < 0 || e.x >= width(diagrams[current]) || e.y >= height(diagrams[current])
			? proposedDragRule.to
			: { x: e.x, y: e.y };
		setProposedDragRule({ ...proposedDragRule, to, altMode: e.raw.shiftKey });
	}

	return (
		<>
			<div className="flex toolbar">
				<input
					value={lemma.name}
					style={{ width: 240 }}
					onChange={e =>
						updateWorkspace(w =>
						{
							w.lemmas[index].name = e.target.value;
						})}
				/>
				{isAxiom
					? <Checkbox label="Track usages" checked={track} onChange={setTrack} />
					: Object.entries(lemma.axioms)
						.filter(([axiom]) => !workspace.ignoredAxioms[axiom])
						.map(([axiom, count]) =>
							`${workspace.lemmas.find(l => l.id === axiom)?.name ?? axiom}: ${count}`
						).join(" - ")}
				{ZoomControls(updateOptions)}
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
			<div className="flex" style={{ alignItems: "center", padding: "var(--gap)" }}>
				<Timeline length={diagrams.length} current={current} onSetCurrent={setCurrent} />
			</div>
		</>
	);
}
