import { type Diagram, diagram, set } from "./Diagram";
import { tile } from "./Tile";

export interface Context
{
	diagrams: Diagram[];
}

// TODO: just for testing
const d1 = diagram(2, 2);
set(d1, { x: 0, y: 0 }, tile("p", [0]));
set(d1, { x: 1, y: 0 }, tile("q", [1]));
set(d1, { x: 0, y: 1 }, tile("b", [2]));
set(d1, { x: 1, y: 1 }, tile("d", [3]));
const d2 = diagram(2, 2);
set(d2, { x: 0, y: 0 }, tile("%", [0, 4, 1]));
set(d2, { x: 1, y: 0 }, tile("$", [2, 0, 7]));
set(d2, { x: 0, y: 1 }, tile("$", [1, 6, 3]));
set(d2, { x: 1, y: 1 }, tile("%", [3, 2, 5]));
export const testContext: Context = {
	diagrams: [d1, d2],
};
