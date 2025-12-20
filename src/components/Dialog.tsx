import "./Dialog.css";
import { XIcon } from "@phosphor-icons/react";

export default function Dialog({ title, width = 400, children, ref }: {
	title: string;
	width?: number;
	children: React.ReactNode;
	ref: React.Ref<HTMLDialogElement>;
})
{
	return (
		<dialog ref={ref} {...{ closedby: "any" }}>
			<form style={{ display: "flex", overflow: "hidden" }}>
				<div className="flex column" style={{ width }}>
					<div className="flex" style={{ justifyContent: "space-between", alignItems: "center" }}>
						<h3 style={{ margin: 0 }}>{title}</h3>
						<button title="Close dialog" formMethod="dialog">
							<XIcon />
						</button>
					</div>
					<div className="divider"></div>
					{children}
				</div>
			</form>
		</dialog>
	);
}
