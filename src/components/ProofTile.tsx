import { ArrowsHorizontalIcon, QuestionMarkIcon } from "@phosphor-icons/react";
import { useMemo } from "react";
import { Diagram, getSignature, width } from "../data/Diagram";
import type { Options } from "../data/Options";
import type { Workspace } from "../data/Workspace";
import DiagramView from "./DiagramView";

export default function ProofTile(
	{ workspace, index, selected, options, dragSignature, dropHandler, onClick }: {
		workspace: Workspace;
		index: number;
		selected: boolean;
		options: Options;
		dragSignature: string | undefined;
		dropHandler: (e: React.DragEvent<HTMLDivElement>, recipe: (draft: Workspace, diagram: Diagram) => void) => void;
		onClick?: () => void;
	},
)
{
	const proof = workspace.proofs[index];
	const template = useMemo(() => proof.lhs?.[0] ?? proof.rhs?.[0] ?? Diagram(2, 2), [proof]);
	const w = useMemo(() => width(template), [template]);
	const signature = useMemo(() => getSignature(template), [template]);
	return (
		<div
			className="hover"
			data-selected={selected}
			onClick={onClick}
		>
			<div className="flex" style={{ alignItems: "center" }}>
				{proof.lhs !== null
					? <DiagramView diagram={proof.lhs[0]} scale={16} maxWidth={128} theme={options.theme} />
					: (
						<UnsetDiagram
							w={w}
							signature={signature}
							dragSignature={dragSignature}
							onDrop={e =>
							{
								dropHandler(e, (ctx, diagram) =>
								{
									ctx.proofs[index].lhs = [diagram, []];
								});
							}}
						/>
					)}
				<ArrowsHorizontalIcon />
				{proof.rhs !== null
					? <DiagramView diagram={proof.rhs[0]} scale={16} maxWidth={128} theme={options.theme} />
					: (
						<UnsetDiagram
							w={w}
							signature={signature}
							dragSignature={dragSignature}
							onDrop={e =>
							{
								dropHandler(e, (ctx, diagram) =>
								{
									ctx.proofs[index].rhs = [diagram, []];
								});
							}}
						/>
					)}
			</div>
		</div>
	);
}

function UnsetDiagram({ w, signature, dragSignature, onDrop }: {
	w: number;
	signature?: string;
	dragSignature?: string;
	onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
})
{
	return (
		<div
			className="flex"
			style={{
				width: w * 16,
				maxWidth: 128,
				alignSelf: "stretch",
				borderRadius: "var(--border-radius)",
				alignItems: "center",
				justifyContent: "center",
			}}
			data-dropzone={dragSignature === signature}
			onDragOver={e =>
			{
				if (e.dataTransfer.types.includes("application/kappa-diagram-index") && dragSignature === signature)
					e.preventDefault();
			}}
			onDrop={onDrop}
		>
			<QuestionMarkIcon />
		</div>
	);
}
