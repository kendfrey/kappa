import {
	ArrowsHorizontalIcon,
	CaretDownIcon,
	CaretRightIcon,
	DotOutlineIcon,
	LinkSimpleHorizontalIcon,
} from "@phosphor-icons/react";
import type { Lemma } from "../data/Lemma";
import type { Theme } from "../data/Options";
import Checkbox from "./Checkbox";
import DiagramView from "./DiagramView";

export default function LemmaTile(
	{ name, lemma, collapsed, hidden, selected, dependency, theme, onClick, onCollapseToggle, onEnabledChange }: {
		name: string;
		lemma: Lemma | undefined;
		collapsed: boolean | undefined;
		hidden: boolean;
		selected: boolean;
		dependency: boolean;
		theme: Theme;
		onClick?: () => void;
		onCollapseToggle?: () => void;
		onEnabledChange?: (enabled: boolean) => void;
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
					? <DotOutlineIcon weight="fill" />
					: (
						<div
							className="hover"
							style={{ borderRadius: "var(--border-radius)", lineHeight: 0, cursor: "pointer" }}
							onClick={e =>
							{
								e.stopPropagation();
								onCollapseToggle?.();
							}}
						>
							{collapsed ? <CaretRightIcon /> : <CaretDownIcon />}
						</div>
					)}
				<span style={lemma?.enabled ?? true ? undefined : { opacity: 0.5, textDecoration: "line-through" }}>
					{name}
				</span>
				<div style={{ flex: 1 }} />
				{lemma && (
					<Checkbox
						label=""
						checked={lemma.enabled}
						onChange={checked =>
						{
							onEnabledChange?.(checked);
						}}
					/>
				)}
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
