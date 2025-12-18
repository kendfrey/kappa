import type { Diagram } from "./Diagram";
import type { Point } from "./Point";
import type { ProofStep } from "./ProofStep";

export type Lemma = {
	id: string;
	name: string;
	lhs: Diagram;
	rhs: Diagram;
	steps: ProofStep[] | null;
	forwardRules: DragRule[];
	reverseRules: DragRule[];
	enabled: boolean;
	axioms: Record<string, number>;
};

export type DragRule = {
	from: Point;
	to: Point;
	altMode: boolean;
};

export function calculateAxioms(steps: ProofStep[], lemmas: Lemma[]): Record<string, number>
{
	const axioms: Record<string, number> = {};
	for (const step of steps.filter(s => s.type === "lemma"))
	{
		for (const [axiom, count] of Object.entries(lemmas.find(l => l.id === step.id)?.axioms ?? {}))
		{
			if (axioms[axiom] === undefined)
				axioms[axiom] = 0;

			axioms[axiom] += count;
		}
	}
	return axioms;
}
