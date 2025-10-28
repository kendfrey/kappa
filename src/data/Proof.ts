import type { Diagram } from "./Diagram";
import type { ProofStep } from "./ProofStep";

export type Proof = {
	lhs: [Diagram, ProofStep[]] | null;
	rhs: [Diagram, ProofStep[]] | null;
};
