import { GearIcon, IconContext, ListIcon, QuestionIcon } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";
import Dialog from "./Dialog";
import { useImmerLocalStorage } from "./immerHooks";
import { defaultOptions } from "./Options";
import OptionsDialog from "./OptionsDialog";
import "./App.css";

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

	const optionsDialogRef = useRef<HTMLDialogElement>(null);
	const helpDialogRef = useRef<HTMLDialogElement>(null);

	return (
		<IconContext.Provider value={{ size: 20 }}>
			<div className="flex" style={{ height: "100vh" }}>
				<div
					className="flex column"
					style={{
						width: 300,
						padding: "var(--border-radius)",
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
					<div>Context</div>
				</div>
				<div>Editor</div>
			</div>
		</IconContext.Provider>
	);
}
