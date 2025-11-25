import { Diagram, set } from "./Diagram";
import type { Lemma } from "./Lemma";
import type { Proof } from "./Proof";
import { Tile } from "./Tile";

export type Workspace = {
	lemmas: Lemma[];
	proofs: Proof[];
	diagrams: Diagram[];
	ignoredAxioms: Record<string, true>;
};

export const emptyWorkspace: Workspace = {
	lemmas: [],
	proofs: [],
	diagrams: [],
	ignoredAxioms: {},
};

// TODO: just for testing
const d1 = Diagram(2, 2);
set(d1, { x: 0, y: 0 }, Tile("p", 0));
set(d1, { x: 1, y: 0 }, Tile("q", 1));
set(d1, { x: 0, y: 1 }, Tile("b", 2));
set(d1, { x: 1, y: 1 }, Tile("d", 3));
const d2 = Diagram(2, 2);
set(d2, { x: 0, y: 0 }, Tile("%", 0, 4, 1));
set(d2, { x: 1, y: 0 }, Tile("$", 2, 0, 7));
set(d2, { x: 0, y: 1 }, Tile("$", 1, 6, 3));
set(d2, { x: 1, y: 1 }, Tile("%", 3, 2, 5));
const d3 = Diagram(1, 1);
set(d3, { x: 0, y: 0 }, Tile("%", 1, 2, 2));
const d4 = Diagram(1, 1);
set(d4, { x: 0, y: 0 }, Tile("$", 2, 1, 1));
export const testWorkspace: Workspace = {
	lemmas: [{
		id: "477f6187-7528-4d7c-923a-9d49d503ecb0",
		name: "CS",
		lhs: d3,
		rhs: d4,
		steps: null,
		axioms: { "477f6187-7528-4d7c-923a-9d49d503ecb0": 1 },
	}],
	proofs: [],
	diagrams: [d1, d2],
	ignoredAxioms: {},
};

export const defaultWorkspace = testWorkspace;
