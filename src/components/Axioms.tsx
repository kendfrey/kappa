import type { ReactNode } from "react";
import type { Workspace } from "../data/Workspace";
import type { WorkspaceSelection } from "./App";
import LemmaLink from "./LemmaLink";

export default function Axioms(
	axioms: Record<string, number>,
	workspace: Workspace,
	setSelection: React.Dispatch<React.SetStateAction<WorkspaceSelection>>,
): ReactNode
{
	const list = Object.entries(axioms)
		.filter(([axiom]) => !workspace.ignoredAxioms[axiom])
		.map(([axiom, count]) => <>{LemmaLink(axiom, workspace, setSelection)}: {count}</>);

	if (list.length === 0)
		return null;

	return <span>{list.reduce((prev, curr) => <>{prev} - {curr}</>)}</span>;
}
