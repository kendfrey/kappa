import {
	ArrowsHorizontalIcon,
	CaretDownIcon,
	CaretRightIcon,
	DotOutlineIcon,
	LinkSimpleHorizontalIcon,
} from "@phosphor-icons/react";
import { memo } from "react";
import type { Lemma } from "../data/Lemma";
import type { Theme } from "../data/Options";
import type { Workspace } from "../data/Workspace";
import type { Updater } from "../hooks";
import Checkbox from "./Checkbox";
import DiagramView from "./DiagramView";

export const LemmaTile_ = memo(function LemmaTile(
	{ name, index, lemma, collapsed, hidden, selected, dependency, theme, updateWorkspace, setSelection }: {
		name: string;
		index: number | undefined;
		lemma: Lemma | undefined;
		collapsed: boolean | undefined;
		hidden: boolean;
		selected: boolean;
		dependency: boolean;
		theme: Theme;
		updateWorkspace: Updater<Workspace>;
		setSelection: (selection: { type: "lemma"; index: number; } | undefined) => void;
	},
)
{
	return (
		<div
			className="flex column tile"
			data-selected={selected}
			data-conflict={dependency}
			onClick={() =>
			{
				if (index !== undefined)
					setSelection(selected ? undefined : { type: "lemma", index });
			}}
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
								updateWorkspace(w =>
								{
									if (w.collapsedLemmas[name])
										delete w.collapsedLemmas[name];
									else
										w.collapsedLemmas[name] = true;
								});
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
							if (index !== undefined)
							{
								updateWorkspace(w =>
								{
									w.lemmas[index].enabled = checked;
								});
							}
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
});

export default LemmaTile_;
