import "./App.css";
import {
	ArrowsHorizontalIcon,
	CaretDownIcon,
	CaretRightIcon,
	CirclesThreeIcon,
	FileArrowUpIcon,
	FileDashedIcon,
	GearIcon,
	IconContext,
	ListChecksIcon,
	ListIcon,
	PlusIcon,
	QuestionIcon,
	ScribbleIcon,
} from "@phosphor-icons/react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Diagram, getSignature, isContinuous } from "../data/Diagram";
import type { Lemma } from "../data/Lemma";
import { defaultOptions } from "../data/Options";
import { validate, type Workspace } from "../data/Workspace";
import {
	axiomsOnlyWorkspace,
	defaultWorkspace,
	emptyWorkspace,
	exampleProofsWorkspace,
	preludeWorkspace,
	puzzlesWorkspace,
} from "../data/workspaces";
import { useImmerLocalStorage } from "../hooks";
import DiagramEditor from "./DiagramEditor";
import DiagramView from "./DiagramView";
import Dialog from "./Dialog";
import LemmaEditor from "./LemmaEditor";
import LemmaTile from "./LemmaTile";
import OptionsDialog from "./OptionsDialog";
import ProofEditor from "./ProofEditor";
import ProofTile from "./ProofTile";

export default function App()
{
	const [options, updateOptions] = useImmerLocalStorage("kappa-options", defaultOptions);

	const bg = options.theme.background;
	const fg = options.theme.colours[0];
	const no = options.theme.colours[1];
	const go = options.theme.colours[3];

	useEffect(() =>
	{
		document.documentElement.style.setProperty("--bg", bg);
		document.documentElement.style.setProperty("--fg", fg);
		document.documentElement.style.setProperty("--no", no);
		document.documentElement.style.setProperty("--go", go);
		const lightness = (c: string) =>
			parseInt(c.slice(1, 3), 16) + parseInt(c.slice(3, 5), 16) + parseInt(c.slice(5, 7), 16);
		document.documentElement.style.setProperty("color-scheme", lightness(bg) >= lightness(fg) ? "light" : "dark");
	}, [bg, fg, no, go]);

	const [workspace, updateWorkspace] = useImmerLocalStorage<Workspace>("kappa-workspace", defaultWorkspace);

	const [selection, setSelection] = useState<WorkspaceSelection>(undefined);

	const [dragSignature, setDragSignature] = useState<string | undefined>(undefined);

	function setWorkspace(workspace: Workspace, force?: boolean)
	{
		if (!force && !confirm("Are you sure? Unsaved changes will be lost."))
			return;

		updateWorkspace(() => workspace);
		setSelection(undefined);
	}

	const menuRef = useRef<HTMLDivElement>(null);
	const optionsDialogRef = useRef<HTMLDialogElement>(null);
	const helpDialogRef = useRef<HTMLDialogElement>(null);
	const exportImportDialogRef = useRef<HTMLDialogElement>(null);
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

	const [dependencies, setDependencies] = useState<{ lemmas: Set<number>; proofs: Set<number>; }>();

	useEffect(() =>
	{
		if (dependencies === undefined)
			return;

		updateWorkspace(w =>
		{
			for (const i of dependencies.lemmas)
			{
				const path = w.lemmas[i].name.split(".");
				let prefix = path[0];
				for (const part of path.slice(1))
				{
					if (w.collapsedLemmas[prefix] === true)
						delete w.collapsedLemmas[prefix];

					prefix += "." + part;
				}
			}
		});
	}, [dependencies, updateWorkspace]);

	useEffect(() =>
	{
		switch (selection?.type)
		{
			case "lemma":
				updateOptions(o =>
				{
					o.lemmasCollapsed = false;
				});
				break;
			case "proof":
				updateOptions(o =>
				{
					o.proofsCollapsed = false;
				});
				break;
			case "diagram":
				updateOptions(o =>
				{
					o.diagramsCollapsed = false;
				});
				break;
		}
		setTimeout(
			() => document.querySelector(".tile[data-selected='true']")?.scrollIntoView({ block: "nearest" }),
			0,
		);
		setDependencies(undefined);
	}, [selection, updateOptions]);

	function getMainPanelContent(): React.ReactNode
	{
		switch (selection?.type)
		{
			case "lemma":
				return (
					<LemmaEditor
						key={selection.index}
						workspace={workspace}
						updateWorkspace={updateWorkspace}
						options={options}
						updateOptions={updateOptions}
						index={selection.index}
						setSelection={setSelection}
						setDependencies={setDependencies}
					/>
				);
			case "proof":
				return (
					<ProofEditor
						key={selection.index}
						workspace={workspace}
						updateWorkspace={updateWorkspace}
						options={options}
						updateOptions={updateOptions}
						index={selection.index}
						setSelection={setSelection}
					/>
				);
			case "diagram":
				return (
					<DiagramEditor
						key={selection.index}
						workspace={workspace}
						updateWorkspace={updateWorkspace}
						options={options}
						updateOptions={updateOptions}
						index={selection.index}
						setSelection={setSelection}
					/>
				);
			case undefined:
				return <></>;
		}
	}

	const lemmaTree = useMemo(() =>
	{
		type LemmaTree = { lemma: [Lemma, number] | undefined; children: Record<string, LemmaTree>; };
		const root: LemmaTree = { lemma: undefined, children: {} };
		for (let i = 0; i < workspace.lemmas.length; i++)
		{
			const lemma = workspace.lemmas[i];
			const parts = lemma.name.split(".");
			let node = root;
			for (const part of parts)
			{
				if (!(part in node.children))
					node.children[part] = { lemma: undefined, children: {} };

				node = node.children[part];
			}
			node.lemma = [lemma, i];
		}

		const collator = new Intl.Collator(undefined, { numeric: true });
		return listify(root.children, "");

		function listify(children: Record<string, LemmaTree>, path: string): LemmaFolder[]
		{
			return Object.entries(children)
				.sort((a, b) => collator.compare(a[0], b[0]))
				.map(([name, child]) => ({
					name: path + name,
					lemma: child.lemma,
					children: listify(child.children, path + name + "."),
				}));
		}
	}, [workspace.lemmas]);

	function unfoldLemmas(folders: LemmaFolder[], hidden: boolean): React.ReactNode[]
	{
		return folders.map(folder =>
		{
			const i = folder.lemma?.[1];
			const selected = selection?.type === "lemma" && selection.index === i;
			const collapsed = workspace.collapsedLemmas[folder.name] === true;
			return [
				<LemmaTile
					key={i ?? folder.name}
					index={i}
					name={folder.name}
					lemma={folder.lemma?.[0]}
					collapsed={folder.children.length > 0 ? collapsed : undefined}
					hidden={hidden || options.lemmasCollapsed}
					selected={selected}
					dependency={i !== undefined && (dependencies?.lemmas.has(i) ?? false)}
					theme={options.theme}
					updateWorkspace={updateWorkspace}
					setSelection={setSelection}
				/>,
				...unfoldLemmas(folder.children, hidden || collapsed),
			];
		});
	}

	return (
		<IconContext.Provider value={useMemo(() => ({ size: 20, weight: "bold" }), [])}>
			<div className="flex" style={{ height: "100vh", gap: 0 }}>
				<div
					className="flex column"
					style={{
						width: 350,
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
						<Dialog title="Export/Import" ref={exportImportDialogRef}>
							Copy this string to export your workspace or paste one to import another workspace:
							<input
								value={JSON.stringify(workspace)}
								onChange={e =>
								{
									setWorkspace(JSON.parse(e.target.value) as Workspace, true);
								}}
							/>
						</Dialog>
						<button popoverTarget="menu">
							<ListIcon />
						</button>
						<div id="menu" ref={menuRef} className="menu" popover="auto">
							<div title="Open options dialog" onClick={() => optionsDialogRef.current?.showModal()}>
								<GearIcon />
								Options
							</div>
							<div title="Open help dialog" onClick={() => helpDialogRef.current?.showModal()}>
								<QuestionIcon />
								Help
							</div>
							<div
								title="Check all lemmas and proofs for correctness"
								onClick={() =>
								{
									menuRef.current?.hidePopover();
									alert(validate(workspace));
								}}
							>
								<ListChecksIcon />
								Validate Workspace
							</div>
							<div
								title="Save your work or restore previous work"
								onClick={() => exportImportDialogRef.current?.showModal()}
							>
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
									title="Start from scratch"
									onClick={() =>
									{
										menuRef.current?.hidePopover();
										setWorkspace(emptyWorkspace);
									}}
								>
									Empty
								</div>
								<div
									title="Just the minimum necessary axioms"
									onClick={() =>
									{
										menuRef.current?.hidePopover();
										setWorkspace(axiomsOnlyWorkspace);
									}}
								>
									Axioms Only
								</div>
								<div
									title="A basic set of lemmas for diagram manipulation"
									onClick={() =>
									{
										menuRef.current?.hidePopover();
										setWorkspace(preludeWorkspace);
									}}
								>
									Prelude (default)
								</div>
								<div
									title="A collection of example proofs"
									onClick={() =>
									{
										menuRef.current?.hidePopover();
										setWorkspace(exampleProofsWorkspace);
									}}
								>
									Example Proofs
								</div>
								<div
									title="Non-obvious diagrams of the unknot"
									onClick={() =>
									{
										menuRef.current?.hidePopover();
										setWorkspace(puzzlesWorkspace);
									}}
								>
									Unknotting Puzzles
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
						<div className="flex column scroll">
							<button
								className="text-button section-header"
								onClick={() =>
									updateOptions(o =>
									{
										o.lemmasCollapsed = !o.lemmasCollapsed;
									})}
							>
								<ArrowsHorizontalIcon />
								Lemmas
								<div style={{ flex: 1 }} />
								{options.lemmasCollapsed ? <CaretRightIcon /> : <CaretDownIcon />}
							</button>
							{unfoldLemmas(lemmaTree, false)}
							<button
								className="text-button section-header"
								title="Drag and drop a diagram here to start a new proof"
								onClick={() =>
									updateOptions(o =>
									{
										o.proofsCollapsed = !o.proofsCollapsed;
									})}
								data-dropzone={dragSignature !== undefined}
								onDragOver={e =>
								{
									if (e.dataTransfer.types.includes("application/kappa-diagram-index"))
										e.preventDefault();
								}}
								onDrop={e =>
								{
									setDragSignature(undefined);
									setSelection({ type: "proof", index: workspace.proofs.length });
									const i = parseInt(e.dataTransfer.getData("application/kappa-diagram-index"));
									updateWorkspace(w =>
									{
										const diagram = w.diagrams.splice(i, 1)[0];
										w.proofs.push({ lhs: [diagram, []], rhs: null });
									});
								}}
							>
								<CirclesThreeIcon weight="fill" />
								Proofs
								<div style={{ flex: 1 }} />
								{options.proofsCollapsed ? <CaretRightIcon /> : <CaretDownIcon />}
							</button>
							{workspace.proofs.map((_, i) =>
							{
								const selected = selection?.type === "proof" && selection.index === i;
								return (
									<ProofTile
										key={i}
										workspace={workspace}
										index={i}
										collapsed={options.proofsCollapsed}
										selected={selected}
										dependency={dependencies?.proofs.has(i) ?? false}
										theme={options.theme}
										dragSignature={dragSignature}
										dropHandler={(e, recipe) =>
										{
											setDragSignature(undefined);
											setSelection({ type: "proof", index: i });
											const diagramIndex = parseInt(
												e.dataTransfer.getData("application/kappa-diagram-index"),
											);
											updateWorkspace(w =>
											{
												const diagram = w.diagrams.splice(diagramIndex, 1)[0];
												recipe(w, diagram);
											});
										}}
										onClick={() => setSelection(selected ? undefined : { type: "proof", index: i })}
									/>
								);
							})}
							<button
								className="text-button section-header"
								onClick={() =>
									updateOptions(o =>
									{
										o.diagramsCollapsed = !o.diagramsCollapsed;
									})}
							>
								<ScribbleIcon />
								Diagrams
								<div style={{ flex: 1 }} />
								{options.diagramsCollapsed ? <CaretRightIcon /> : <CaretDownIcon />}
							</button>
							{workspace.diagrams.map((d, i) =>
							{
								const selected = selection?.type === "diagram" && selection.index === i;
								const continuous = isContinuous(d);
								return (
									<div
										key={i}
										className="tile"
										data-selected={selected}
										onClick={() =>
											setSelection(selected ? undefined : { type: "diagram", index: i })}
										style={{ display: options.diagramsCollapsed ? "none" : undefined }}
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
								style={{ alignSelf: "start" }}
								title="Create a new blank diagram"
								onClick={() =>
								{
									setSelection({ type: "diagram", index: workspace.diagrams.length });
									updateWorkspace(w =>
									{
										w.diagrams.push(Diagram(4, 4));
									});
								}}
							>
								<PlusIcon />
								New Diagram
							</button>
						</div>
					</div>
				</div>
				{getMainPanelContent()}
			</div>
		</IconContext.Provider>
	);
}

export type WorkspaceSelection =
	| { type: "lemma"; index: number; }
	| { type: "proof"; index: number; }
	| { type: "diagram"; index: number; }
	| undefined;

type LemmaFolder = {
	name: string;
	lemma: [Lemma, number] | undefined;
	children: LemmaFolder[];
};
