import type { Workspace } from "../data/Workspace";
import type { WorkspaceSelection } from "./App";

export default function LemmaLink(
	id: string,
	workspace: Workspace,
	setSelection: React.Dispatch<React.SetStateAction<WorkspaceSelection>>,
)
{
	const index = workspace.lemmas.findIndex(l => l.id === id);
	return (
		<a
			onClick={() =>
			{
				if (index >= 0)
					setSelection({ type: "lemma", index });
			}}
		>
			{workspace.lemmas[index]?.name ?? id}
		</a>
	);
}
