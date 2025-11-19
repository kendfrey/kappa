import "./App.css";
import {
	ArrowsHorizontalIcon,
	CaretRightIcon,
	CirclesThreeIcon,
	FileArrowUpIcon,
	FileDashedIcon,
	GearIcon,
	IconContext,
	ListIcon,
	PlusIcon,
	QuestionIcon,
	ScribbleIcon,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { type Context, defaultContext, emptyContext, testContext } from "../data/Context";
import { Diagram, getSignature, isContinuous } from "../data/Diagram";
import { defaultOptions } from "../data/Options";
import { useImmerLocalStorage } from "../hooks";
import DiagramEditor from "./DiagramEditor";
import DiagramView from "./DiagramView";
import Dialog from "./Dialog";
import OptionsDialog from "./OptionsDialog";
import ProofEditor from "./ProofEditor";
import ProofTile from "./ProofTile";

export default function App()
{
	const [options, updateOptions] = useImmerLocalStorage("kappa-options", defaultOptions);

	const bg = options.theme.background;
	const fg = options.theme.colours[0];
	const go = options.theme.colours[3];

	useEffect(() =>
	{
		document.documentElement.style.setProperty("--bg", bg);
		document.documentElement.style.setProperty("--fg", fg);
		document.documentElement.style.setProperty("--go", go);
		const lightness = (c: string) =>
			parseInt(c.slice(1, 3), 16) + parseInt(c.slice(3, 5), 16) + parseInt(c.slice(5, 7), 16);
		document.documentElement.style.setProperty("color-scheme", lightness(bg) >= lightness(fg) ? "light" : "dark");
	}, [bg, fg, go]);

	const [context, updateContext] = useImmerLocalStorage<Context>("kappa-context", defaultContext);

	const [selection, setSelection] = useState<ContextSelection>(undefined);

	const [dragSignature, setDragSignature] = useState<string | undefined>(undefined);

	function setContext(context: Context, force?: boolean)
	{
		if (!force && !confirm("Are you sure? Unsaved changes will be lost."))
			return;

		updateContext(() => context);
		setSelection(undefined);
	}

	function exportImport()
	{
		menuRef.current?.hidePopover();

		const current = JSON.stringify(context);
		const result = prompt("Copy this string or paste one to import:", current);
		if (result?.trim() && result !== current)
			setContext(JSON.parse(result) as Context, true);
	}

	const menuRef = useRef<HTMLDivElement>(null);
	const optionsDialogRef = useRef<HTMLDialogElement>(null);
	const helpDialogRef = useRef<HTMLDialogElement>(null);
	const resetWorkspaceRef = useRef<HTMLDivElement>(null);
	const resetWorkspaceTimeoutRef = useRef<number>(0);

	function showResetWorkspace()
	{
		if (resetWorkspaceTimeoutRef.current)
			clearTimeout(resetWorkspaceTimeoutRef.current);

		resetWorkspaceRef.current?.showPopover();
	}

	function hideResetWorkspace()
	{
		resetWorkspaceTimeoutRef.current = window.setTimeout(() => resetWorkspaceRef.current?.hidePopover(), 100);
	}

	function getMainPanelContent(): React.ReactNode
	{
		switch (selection?.type)
		{
			case "lemma":
				return <>Lemma {selection.index}</>;
			case "proof":
				return (
					<ProofEditor
						key={selection.index}
						context={context}
						updateContext={updateContext}
						options={options}
						updateOptions={updateOptions}
						index={selection.index}
					/>
				);
			case "diagram":
				return (
					<DiagramEditor
						key={selection.index}
						context={context}
						updateContext={updateContext}
						options={options}
						updateOptions={updateOptions}
						index={selection.index}
					/>
				);
			case undefined:
				return <></>;
		}
	}

	return (
		<IconContext.Provider value={{ size: 20, weight: "bold" }}>
			<div className="flex" style={{ height: "100vh", gap: 0 }}>
				<div
					className="flex column"
					style={{
						width: 330,
						padding: "var(--gap)",
						borderRight: "var(--border)",
						backgroundColor: "var(--highlight-1)",
					}}
				>
					<div className="flex">
						<Dialog title="Options" ref={optionsDialogRef}>
							<OptionsDialog options={options} updateOptions={updateOptions} />
						</Dialog>
						<Dialog title="Help" ref={helpDialogRef}>TODO</Dialog>
						<button popoverTarget="menu">
							<ListIcon />
						</button>
						<div id="menu" ref={menuRef} className="menu" popover="auto">
							<div onClick={() => optionsDialogRef.current?.showModal()}>
								<GearIcon />
								Options
							</div>
							<div onClick={() => helpDialogRef.current?.showModal()}>
								<QuestionIcon />
								Help
							</div>
							<div onClick={exportImport}>
								<FileArrowUpIcon />
								Export/Import...
							</div>
							<div
								onMouseEnter={showResetWorkspace}
								onMouseLeave={hideResetWorkspace}
								// @ts-expect-error - anchor-name isn't in the type declaration yet
								style={{ anchorName: "--reset-workspace" }}
							>
								<FileDashedIcon />
								Reset Workspace
								<CaretRightIcon style={{ marginLeft: "auto" }} />
							</div>
							<div
								ref={resetWorkspaceRef}
								className="menu"
								popover="auto"
								// @ts-expect-error - position-anchor isn't in the type declaration yet
								style={{ positionAnchor: "--reset-workspace" }}
								onMouseEnter={showResetWorkspace}
								onMouseLeave={hideResetWorkspace}
							>
								<div
									onClick={() =>
									{
										menuRef.current?.hidePopover();
										setContext(emptyContext);
									}}
								>
									Empty
								</div>
								<div
									onClick={() =>
									{
										menuRef.current?.hidePopover();
										setContext(testContext);
									}}
								>
									Test (default)
								</div>
							</div>
						</div>
					</div>
					<div className="divider"></div>
					<div
						style={{
							backgroundColor: "var(--bg)",
							borderRadius: "var(--border-radius)",
							overflow: "hidden",
							flex: 1,
						}}
					>
						<div className="scroll">
							<div className="flex section-header">
								<ArrowsHorizontalIcon /> Lemmas
							</div>
							<div
								className="flex section-header"
								data-dropzone={dragSignature !== undefined}
								onDragOver={e =>
								{
									if (e.dataTransfer.types.includes("application/kappa-diagram-index"))
										e.preventDefault();
								}}
								onDrop={e =>
								{
									setDragSignature(undefined);
									setSelection({ type: "proof", index: context.proofs.length });
									const i = parseInt(e.dataTransfer.getData("application/kappa-diagram-index"));
									updateContext(ctx =>
									{
										const diagram = ctx.diagrams.splice(i, 1)[0];
										ctx.proofs.push({ lhs: [diagram, []], rhs: null });
									});
								}}
							>
								<CirclesThreeIcon weight="fill" /> Proofs
							</div>
							<div className="section-body">
								{context.proofs.map((_, i) =>
								{
									const selected = selection?.type === "proof" && selection.index === i;
									return (
										<ProofTile
											key={i}
											context={context}
											index={i}
											selected={selected}
											options={options}
											dragSignature={dragSignature}
											dropHandler={(e, recipe) =>
											{
												setDragSignature(undefined);
												setSelection({ type: "proof", index: i });
												const diagramIndex = parseInt(
													e.dataTransfer.getData("application/kappa-diagram-index"),
												);
												updateContext(ctx =>
												{
													const diagram = ctx.diagrams.splice(diagramIndex, 1)[0];
													recipe(ctx, diagram);
												});
											}}
											onClick={() =>
												setSelection(selected ? undefined : { type: "proof", index: i })}
										/>
									);
								})}
							</div>
							<div className="flex section-header">
								<ScribbleIcon /> Diagrams
							</div>
							<div className="section-body">
								{context.diagrams.map((d, i) =>
								{
									const selected = selection?.type === "diagram" && selection.index === i;
									const continuous = isContinuous(d);
									return (
										<div
											key={i}
											className="hover"
											data-selected={selected}
											onClick={() =>
												setSelection(selected ? undefined : { type: "diagram", index: i })}
											draggable={continuous}
											onDragStart={e =>
											{
												const img = (e.target as HTMLDivElement).firstElementChild as
													| HTMLCanvasElement
													| null;
												if (img !== null)
													e.dataTransfer.setDragImage(img, img.width, img.height);
												e.dataTransfer.setData("application/kappa-diagram-index", i.toString());
												e.dataTransfer.effectAllowed = "move";
												setDragSignature(getSignature(d));
											}}
											onDragEnd={() =>
											{
												setDragSignature(undefined);
											}}
										>
											<DiagramView diagram={d} scale={16} maxWidth={256} theme={options.theme} />
										</div>
									);
								})}
								<button
									className="text-button"
									style={{ margin: "var(--gap) 0" }}
									onClick={() =>
									{
										setSelection({ type: "diagram", index: context.diagrams.length });
										updateContext(ctx =>
										{
											ctx.diagrams.push(Diagram(4, 4));
										});
									}}
								>
									<PlusIcon />
									<span>New Diagram</span>
								</button>
							</div>
						</div>
					</div>
				</div>
				<div className="flex column" style={{ flex: 1, gap: 0, width: 0 }}>{getMainPanelContent()}</div>
			</div>
		</IconContext.Provider>
	);
}

type ContextSelection =
	| { type: "lemma"; index: number; }
	| { type: "proof"; index: number; }
	| { type: "diagram"; index: number; }
	| undefined;
