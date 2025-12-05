import {
	ArrowsHorizontalIcon,
	CaretDownIcon,
	CaretRightIcon,
	DotIcon,
	LinkSimpleHorizontalIcon,
} from "@phosphor-icons/react";
import type { Lemma } from "../data/Lemma";
import type { Theme } from "../data/Options";
import DiagramView from "./DiagramView";

export default function LemmaTile(
	{ name, lemma, collapsed, hidden, selected, dependency, theme, onClick, onCollapseToggle }: {
		name: string;
		lemma: Lemma | undefined;
		collapsed: boolean | undefined;
		hidden: boolean;
		selected: boolean;
		dependency: boolean;
		theme: Theme;
		onClick?: () => void;
		onCollapseToggle?: () => void;
	},
)
{
	return (
		<div
			className="flex column tile"
			data-selected={selected}
			data-conflict={dependency}
			onClick={onClick}
			style={{ overflow: "hidden", display: hidden ? "none" : undefined }}
		>
			<div className="flex">
				{collapsed === undefined
					? <DotIcon />
					: (
						<div
							className="hover"
							style={{ borderRadius: "var(--border-radius)", lineHeight: 0 }}
							onClick={e =>
							{
								e.stopPropagation();
								onCollapseToggle?.();
							}}
						>
							{collapsed ? <CaretRightIcon /> : <CaretDownIcon />}
						</div>
					)}
				{name}
			</div>
			{lemma && (
				<div className="flex" style={{ alignItems: "center" }}>
					<DiagramView diagram={lemma.lhs} scale={16} maxWidth={128} theme={theme} />
					{lemma.steps === null ? <LinkSimpleHorizontalIcon /> : <ArrowsHorizontalIcon />}
					<DiagramView diagram={lemma.rhs} scale={16} maxWidth={128} theme={theme} />
				</div>
			)}
		</div>
	);
}
