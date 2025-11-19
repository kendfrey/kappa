import { Diagram, set } from "./Diagram";
import type { Proof } from "./Proof";
import { Tile } from "./Tile";

export type Context = {
	proofs: Proof[];
	diagrams: Diagram[];
};

export const emptyContext: Context = {
	proofs: [],
	diagrams: [],
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
export const testContext: Context = {
	proofs: [],
	diagrams: [d1, d2],
};

export const defaultContext = testContext;
