import "./App.css";
import {
	ArrowsLeftRightIcon,
	GearIcon,
	IconContext,
	ListIcon,
	QuestionIcon,
	ScribbleIcon,
	ShuffleIcon,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { type Context, testContext } from "../data/Context";
import { defaultOptions } from "../data/Options";
import { useImmerLocalStorage } from "../hooks";
import DiagramEditor from "./DiagramEditor";
import DiagramView from "./DiagramView";
import Dialog from "./Dialog";
import OptionsDialog from "./OptionsDialog";

export default function App()
{
	const [options, updateOptions] = useImmerLocalStorage("kappa-options", defaultOptions);

	const bg = options.theme.background;
	const fg = options.theme.colours[0];

	useEffect(() =>
	{
		document.documentElement.style.setProperty("--bg", bg);
		document.documentElement.style.setProperty("--fg", fg);
		const lightness = (c: string) =>
			parseInt(c.slice(1, 3), 16) + parseInt(c.slice(3, 5), 16) + parseInt(c.slice(5, 7), 16);
		document.documentElement.style.setProperty("color-scheme", lightness(bg) >= lightness(fg) ? "light" : "dark");
	}, [bg, fg]);

	const [context, updateContext, removeContext] = useImmerLocalStorage<Context>("kappa-context", testContext);

	const [selection, setSelection] = useState<ContextSelection>(undefined);

	// TODO: just for testing
	useEffect(() =>
	{
		removeContext();
	}, [removeContext]);

	const optionsDialogRef = useRef<HTMLDialogElement>(null);
	const helpDialogRef = useRef<HTMLDialogElement>(null);

	function getMainPanelContent(): React.ReactNode
	{
		switch (selection?.type)
		{
			case "lemma":
				return <>Lemma {selection.index}</>;
			case "proof":
				return <>Proof {selection.index}</>;
			case "diagram":
				return (
					<DiagramEditor
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
		<IconContext.Provider value={{ size: 20 }}>
			<div className="flex" style={{ height: "100vh", gap: 0 }}>
				<div
					className="flex column"
					style={{
						width: 300,
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
						<div id="menu" className="menu" popover="auto">
							<div onClick={() => optionsDialogRef.current?.showModal()}>
								<GearIcon />
								Options
							</div>
							<div onClick={() => helpDialogRef.current?.showModal()}>
								<QuestionIcon />
								Help
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
								<ArrowsLeftRightIcon /> Lemmas
							</div>
							<div className="flex section-header">
								<ShuffleIcon /> Proofs
							</div>
							<div className="flex section-header">
								<ScribbleIcon /> Diagrams
							</div>
							<div style={{ margin: "var(--gap)" }}>
								{context.diagrams.map((d, i) =>
								{
									const selected = selection?.type === "diagram" && selection.index === i;
									return (
										<div
											key={i}
											className="hover"
											data-selected={selected}
											style={{
												borderRadius: "var(--border-radius)",
												padding: "var(--gap)",
											}}
											onClick={() =>
												setSelection(selected ? undefined : { type: "diagram", index: i })}
										>
											<DiagramView diagram={d} scale={16} theme={options.theme} />
										</div>
									);
								})}
							</div>
						</div>
					</div>
				</div>
				<div style={{ flex: 1 }}>{getMainPanelContent()}</div>
			</div>
		</IconContext.Provider>
	);
}

type ContextSelection =
	| { type: "lemma"; index: number; }
	| { type: "proof"; index: number; }
	| { type: "diagram"; index: number; }
	| undefined;
