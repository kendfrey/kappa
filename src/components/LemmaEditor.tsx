import "./Editor.css";
import { produce } from "immer";
import { useMemo, useState } from "react";
import type { Options } from "../data/Options";
import { applyStep } from "../data/ProofStep";
import type { Workspace } from "../data/Workspace";
import type { Updater } from "../hooks";
import Checkbox from "./Checkbox";
import DiagramView from "./DiagramView";
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
				diagrams.push(produce(diagrams.at(-1)!, d => applyStep(d, step)));
		}
		return diagrams;
	}, [lemma]);

	const [current, setCurrent] = useState<number>(0);

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
				{isAxiom ? <Checkbox label="Track usages" checked={track} onChange={setTrack} /> : "TODO: usages"}
				{ZoomControls(updateOptions)}
			</div>
			<div className="editor">
				<DiagramView diagram={diagrams[current]} scale={options.scale} theme={options.theme} />
			</div>
			<div className="flex" style={{ alignItems: "center", padding: "var(--gap)" }}>
				<Timeline length={diagrams.length} current={current} onSetCurrent={setCurrent} />
			</div>
		</>
	);
}
