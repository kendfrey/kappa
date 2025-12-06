import type { Diagram } from "./Diagram";
import type { Point } from "./Point";
import type { ProofStep } from "./ProofStep";
import type { Workspace } from "./Workspace";

export type Lemma = {
	id: string;
	name: string;
	lhs: Diagram;
	rhs: Diagram;
	steps: ProofStep[] | null;
	forwardRules: DragRule[];
	reverseRules: DragRule[];
	axioms: Record<string, number>;
};

export type DragRule = {
	from: Point;
	to: Point;
	altMode: boolean;
};

export function calculateAxioms(steps: ProofStep[], workspace: Workspace): Record<string, number>
{
	const axioms: Record<string, number> = {};
	for (const step of steps.filter(s => s.type === "lemma"))
	{
		for (const [axiom, count] of Object.entries(workspace.lemmas.find(l => l.id === step.id)?.axioms ?? {}))
		{
			if (axioms[axiom] === undefined)
				axioms[axiom] = 0;

			axioms[axiom] += count;
		}
	}
	return axioms;
}

export function displayAxioms(axioms: Record<string, number>, workspace: Workspace): string
{
	return Object.entries(axioms)
		.filter(([axiom]) => !workspace.ignoredAxioms[axiom])
		.map(([axiom, count]) => `${workspace.lemmas.find(l => l.id === axiom)?.name ?? axiom}: ${count}`)
		.join(" - ");
}
