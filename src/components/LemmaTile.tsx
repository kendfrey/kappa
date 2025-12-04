import { ArrowsHorizontalIcon, LinkSimpleHorizontalIcon } from "@phosphor-icons/react";
import type { Theme } from "../data/Options";
import type { Workspace } from "../data/Workspace";
import DiagramView from "./DiagramView";

export default function LemmaTile({ workspace, index, collapsed, selected, dependency, theme, onClick }: {
	workspace: Workspace;
	index: number;
	collapsed: boolean;
	selected: boolean;
	dependency: boolean;
	theme: Theme;
	onClick?: () => void;
})
{
	const lemma = workspace.lemmas[index];

	return (
		<div
			className="flex column tile hover"
			data-selected={selected}
			data-dependency={dependency}
			onClick={onClick}
			style={{ overflow: "hidden", display: collapsed ? "none" : undefined }}
		>
			{lemma.name}
			<div className="flex" style={{ alignItems: "center" }}>
				<DiagramView diagram={lemma.lhs} scale={16} maxWidth={128} theme={theme} />
				{lemma.steps === null ? <LinkSimpleHorizontalIcon /> : <ArrowsHorizontalIcon />}
				<DiagramView diagram={lemma.rhs} scale={16} maxWidth={128} theme={theme} />
			</div>
		</div>
	);
}
