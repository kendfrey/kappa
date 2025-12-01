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
	axioms: Record<string, number>;
};

export type DragRule = {
	from: Point;
	to: Point;
	altMode: boolean;
};
