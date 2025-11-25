import type { Diagram } from "./Diagram";
import type { ProofStep } from "./ProofStep";

export type Lemma = {
	id: string;
	name: string;
	lhs: Diagram;
	rhs: Diagram;
	steps: ProofStep[] | null;
	axioms: Record<string, number>;
	// TODO drag rules
};
