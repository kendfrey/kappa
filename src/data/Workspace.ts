import { Diagram } from "./Diagram";
import type { Lemma } from "./Lemma";
import type { Proof } from "./Proof";

export type Workspace = {
	lemmas: Lemma[];
	proofs: Proof[];
	diagrams: Diagram[];
	ignoredAxioms: Record<string, true>;
	collapsedLemmas: Record<string, true>;
};
